import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { optionalAuth, requireManage } from "../auth.js";

export const eventsRouter = Router();

function canManage(req: Parameters<typeof optionalAuth>[0]) {
  return req.user?.roles.some((r) => r === "admin" || r === "instructor") ?? false;
}

const createSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  category: z.string().nullable().optional(),
  date_label: z.string().nullable().optional(),
  time_label: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  price_idr: z.number().int().nonnegative().default(0),
  is_free: z.boolean().optional(),
  spots: z.number().int().nullable().optional(),
  spots_left: z.number().int().nullable().optional(),
  speaker: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  highlights: z.array(z.string()).optional(),
  cover_image_url: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  position: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/events — managers see all; public sees only published
eventsRouter.get("/", optionalAuth, async (req, res) => {
  const where = canManage(req) ? {} : { is_published: true };
  const events = await prisma.event.findMany({
    where,
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
  });
  res.json(events);
});

// GET /api/events/slug/:slug — detail publik
eventsRouter.get("/slug/:slug", optionalAuth, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { slug: req.params.slug } });
  if (!event) return res.status(404).json({ error: "Event tidak ditemukan" });
  if (!event.is_published && !canManage(req)) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(event);
});

// GET /api/events/:id
eventsRouter.get("/:id", optionalAuth, async (req, res) => {
  const event = await prisma.event.findUnique({ where: { id: req.params.id } });
  if (!event) return res.status(404).json({ error: "Event tidak ditemukan" });
  if (!event.is_published && !canManage(req)) {
    return res.status(404).json({ error: "Event tidak ditemukan" });
  }
  res.json(event);
});

// POST /api/events
eventsRouter.post("/", ...requireManage, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const event = await prisma.event.create({ data: parsed.data });
    res.status(201).json(event);
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ error: "Slug sudah dipakai" });
    throw e;
  }
});

// PATCH /api/events/:id
eventsRouter.patch("/:id", ...requireManage, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const event = await prisma.event.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(event);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Event tidak ditemukan" });
    if (e?.code === "P2002") return res.status(409).json({ error: "Slug sudah dipakai" });
    throw e;
  }
});

// DELETE /api/events/:id
eventsRouter.delete("/:id", ...requireManage, async (req, res) => {
  try {
    await prisma.event.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Event tidak ditemukan" });
    throw e;
  }
});
