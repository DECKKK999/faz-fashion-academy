import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { optionalAuth, requireManage } from "../auth.js";
import { uploadCourseCover } from "../upload.js";

export const coursesRouter = Router();

const courseCreateSchema = z.object({
  title: z.string().min(1).default("Untitled Course"),
  slug: z.string().min(1),
  price_idr: z.number().int().nonnegative().default(0),
});

const courseUpdateSchema = z.object({
  title: z.string().optional(),
  slug: z.string().optional(),
  subtitle: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  instructor_name: z.string().nullable().optional(),
  price_idr: z.number().int().nonnegative().optional(),
  level: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  is_published: z.boolean().optional(),
});

function canManage(req: Parameters<typeof optionalAuth>[0]) {
  return req.user?.roles.some((r) => r === "admin" || r === "instructor") ?? false;
}

// GET /api/courses — managers see all; public sees only published
coursesRouter.get("/", optionalAuth, async (req, res) => {
  const where = canManage(req) ? {} : { is_published: true };
  const courses = await prisma.course.findMany({
    where,
    orderBy: { created_at: "desc" },
  });
  res.json(courses);
});

// GET /api/courses/slug/:slug — untuk halaman detail publik
coursesRouter.get("/slug/:slug", optionalAuth, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course) return res.status(404).json({ error: "Course tidak ditemukan" });
  if (!course.is_published && !canManage(req)) {
    return res.status(404).json({ error: "Course tidak ditemukan" });
  }
  res.json(course);
});

// GET /api/courses/:id/purchase-state — status kepemilikan & order aktif user
coursesRouter.get("/:id/purchase-state", optionalAuth, async (req, res) => {
  if (!req.user) return res.json({ enrolled: false, order: null });
  const [enrolled, order] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: req.user.id, course_id: req.params.id } },
    }),
    prisma.order.findFirst({
      where: {
        user_id: req.user.id,
        course_id: req.params.id,
        status: { in: ["pending", "awaiting_verification", "rejected"] },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);
  res.json({ enrolled: !!enrolled, order });
});

// GET /api/courses/:id
coursesRouter.get("/:id", optionalAuth, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) return res.status(404).json({ error: "Course tidak ditemukan" });
  if (!course.is_published && !canManage(req)) {
    return res.status(404).json({ error: "Course tidak ditemukan" });
  }
  res.json(course);
});

// GET /api/courses/:id/modules
coursesRouter.get("/:id/modules", ...requireManage, async (req, res) => {
  const modules = await prisma.module.findMany({
    where: { course_id: req.params.id },
    orderBy: { position: "asc" },
  });
  res.json(modules);
});

// GET /api/courses/:id/lessons — all lessons across the course's modules
coursesRouter.get("/:id/lessons", ...requireManage, async (req, res) => {
  const lessons = await prisma.lesson.findMany({
    where: { module: { course_id: req.params.id } },
    orderBy: { position: "asc" },
  });
  res.json(lessons);
});

// POST /api/courses
coursesRouter.post("/", ...requireManage, async (req, res) => {
  const parsed = courseCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const course = await prisma.course.create({ data: parsed.data });
    res.status(201).json(course);
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ error: "Slug sudah dipakai" });
    throw e;
  }
});

// PATCH /api/courses/:id
coursesRouter.patch("/:id", ...requireManage, async (req, res) => {
  const parsed = courseUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const course = await prisma.course.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(course);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Course tidak ditemukan" });
    if (e?.code === "P2002") return res.status(409).json({ error: "Slug sudah dipakai" });
    throw e;
  }
});

// POST /api/courses/:id/cover — unggah cover image (field 'cover')
coursesRouter.post("/:id/cover", ...requireManage, uploadCourseCover.single("cover"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Gambar cover wajib diunggah" });
  const cover_image_url = `/api/uploads/${req.file.filename}`;
  try {
    const course = await prisma.course.update({ where: { id: req.params.id }, data: { cover_image_url } });
    res.json(course);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Course tidak ditemukan" });
    throw e;
  }
});

// DELETE /api/courses/:id (cascades modules + lessons)
coursesRouter.delete("/:id", ...requireManage, async (req, res) => {
  try {
    await prisma.course.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Course tidak ditemukan" });
    throw e;
  }
});

// POST /api/courses/:id/modules
coursesRouter.post("/:id/modules", ...requireManage, async (req, res) => {
  const schema = z.object({ title: z.string().min(1).default("New Module"), position: z.number().int().default(0) });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  const module = await prisma.module.create({
    data: { course_id: req.params.id, ...parsed.data },
  });
  res.status(201).json(module);
});
