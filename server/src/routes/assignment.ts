import { Router } from "express";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireManage } from "../auth.js";
import { uploadAssignmentFile, ASSIGNMENT_MAX_BYTES } from "../upload.js";
import { lessonCompletion } from "./quiz.js";
import { fileMatchesMime, removeSubmissionFile, submissionFilePath } from "../lib/assignment.js";

// assignmentRouter       → /api/assignments        (peserta)
// adminAssignmentRouter  → /api/admin/assignments  (admin / instruktur)
export const assignmentRouter = Router();
export const adminAssignmentRouter = Router();

// Express 4 tidak menangkap error dari handler async — teruskan ke error handler global
// (alih-alih jadi unhandled rejection).
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
const wrap = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};

function isManager(req: Request): boolean {
  return req.user?.roles.some((r) => r === "admin" || r === "instructor") ?? false;
}

const submissionSelect = {
  id: true,
  file_name: true,
  file_size: true,
  mime_type: true,
  note: true,
  submitted_at: true,
  updated_at: true,
} as const;

const courseSelect = { id: true, slug: true, title: true, is_published: true } as const;

// ============ PESERTA ============

// GET /api/assignments/by-course-slug/:slug — status Tugas Akhir + pengumpulan milik sendiri
assignmentRouter.get("/by-course-slug/:slug", requireAuth, wrap(async (req, res) => {
  const canManage = isManager(req);
  const userId = req.user!.id;
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, select: courseSelect });
  if (!course || (!course.is_published && !canManage)) {
    return res.status(404).json({ error: "Kelas tidak ditemukan" });
  }

  const [enrollment, lessons, assignment] = await Promise.all([
    prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: course.id } },
      select: { id: true },
    }),
    lessonCompletion(userId, course.id),
    prisma.assignment.findUnique({ where: { course_id: course.id } }),
  ]);
  const enrolled = !!enrollment;
  const base = {
    course: { id: course.id, slug: course.slug, title: course.title },
    access: { enrolled, can_manage: canManage },
    lessons,
  };

  // Instruksi hanya untuk peserta terdaftar (dan pengelola).
  if (!assignment || (!assignment.is_published && !canManage) || (!enrolled && !canManage)) {
    return res.json({ ...base, assignment: null, unlocked: false, submission: null, max_file_mb: ASSIGNMENT_MAX_BYTES / 1024 / 1024 });
  }

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignment_id_user_id: { assignment_id: assignment.id, user_id: userId } },
    select: submissionSelect,
  });

  res.json({
    ...base,
    assignment: { id: assignment.id, title: assignment.title, description: assignment.description },
    // Terbuka setelah semua pelajaran selesai; hanya peserta terdaftar yang bisa mengumpulkan.
    unlocked: enrolled && lessons.all_done,
    submission,
    max_file_mb: ASSIGNMENT_MAX_BYTES / 1024 / 1024,
  });
}));

// Cek syarat SEBELUM file diterima multer, supaya request yang pasti ditolak tidak menulis file ke disk.
const checkCanSubmit = wrap(async (req, res, next) => {
  const userId = req.user!.id;
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.assignmentId },
    include: { course: { select: { id: true, is_published: true } } },
  });
  if (!assignment || !assignment.is_published || !assignment.course.is_published) {
    return res.status(404).json({ error: "Tugas tidak ditemukan" });
  }

  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: assignment.course_id } },
    select: { id: true },
  });
  if (!enrollment) return res.status(403).json({ error: "Kamu belum terdaftar pada kelas ini" });

  const lessons = await lessonCompletion(userId, assignment.course_id);
  if (!lessons.all_done) {
    return res.status(409).json({ error: "Selesaikan semua pelajaran terlebih dahulu sebelum mengumpulkan tugas" });
  }

  res.locals.assignmentId = assignment.id;
  next();
});

function receiveFile(req: Request, res: Response, next: NextFunction) {
  uploadAssignmentFile.single("file")(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE" ? `Ukuran file maksimal ${ASSIGNMENT_MAX_BYTES / 1024 / 1024} MB` : "Upload file gagal";
      return res.status(400).json({ error: message });
    }
    return res.status(400).json({ error: err instanceof Error ? err.message : "Upload file gagal" });
  });
}

// multer membaca nama file sebagai latin1; kembalikan ke UTF-8 supaya nama berbahasa Indonesia/emoji tidak rusak.
function decodeFileName(raw: string): string {
  const utf8 = Buffer.from(raw, "latin1").toString("utf8");
  const name = utf8.includes("�") ? raw : utf8;
  return name.trim().slice(0, 200) || "tugas-akhir";
}

// POST /api/assignments/:assignmentId/submit  (multipart: file, note?)
assignmentRouter.post("/:assignmentId/submit", requireAuth, checkCanSubmit, receiveFile, wrap(async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "File tugas wajib diunggah" });

  const noteParsed = z.string().trim().max(1000, "Catatan maksimal 1000 karakter").optional().safeParse(req.body?.note);
  if (!noteParsed.success) {
    await removeSubmissionFile(file.filename);
    return res.status(400).json({ error: noteParsed.error.errors[0]?.message ?? "Catatan tidak valid" });
  }

  if (!(await fileMatchesMime(file.path, file.mimetype))) {
    await removeSubmissionFile(file.filename);
    return res.status(400).json({ error: "Isi file tidak sesuai dengan formatnya. Unggah PDF, JPG, PNG, atau WebP yang valid." });
  }

  const assignmentId = res.locals.assignmentId as string;
  const userId = req.user!.id;
  const where = { assignment_id_user_id: { assignment_id: assignmentId, user_id: userId } };
  const data = {
    file_name: decodeFileName(file.originalname),
    file_path: file.filename,
    file_size: file.size,
    mime_type: file.mimetype,
    note: noteParsed.data || null,
  };

  try {
    const previous = await prisma.assignmentSubmission.findUnique({ where, select: { file_path: true } });
    const submission = await prisma.assignmentSubmission.upsert({
      where,
      create: { assignment_id: assignmentId, user_id: userId, ...data },
      update: { ...data, submitted_at: new Date() },
      select: submissionSelect,
    });
    // Kirim ulang menimpa karya lama — buang file sebelumnya.
    if (previous && previous.file_path !== file.filename) await removeSubmissionFile(previous.file_path);
    res.status(201).json(submission);
  } catch (e) {
    await removeSubmissionFile(file.filename);
    throw e;
  }
}));

// GET /api/assignments/submissions/:id/file — pemilik atau pengelola
assignmentRouter.get("/submissions/:id/file", requireAuth, wrap(async (req, res) => {
  const submission = await prisma.assignmentSubmission.findUnique({
    where: { id: req.params.id },
    select: { user_id: true, file_name: true, file_path: true, mime_type: true },
  });
  if (!submission || (submission.user_id !== req.user!.id && !isManager(req))) {
    return res.status(404).json({ error: "File tidak ditemukan" });
  }

  res.setHeader("Content-Type", submission.mime_type);
  res.setHeader("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(submission.file_name)}`);
  res.setHeader("Cache-Control", "private, no-store");
  res.sendFile(submissionFilePath(submission.file_path), (err) => {
    if (err && !res.headersSent) res.status(404).json({ error: "File tidak ditemukan" });
  });
}));

// ============ ADMIN / INSTRUKTUR ============

const metaSchema = z.object({
  title: z.string().trim().min(1, "Judul wajib diisi").max(120).optional(),
  description: z.string().max(10000).nullable().optional(),
  is_published: z.boolean().optional(),
});

// GET /api/admin/assignments/by-course/:courseId
adminAssignmentRouter.get("/by-course/:courseId", ...requireManage, wrap(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { course_id: req.params.courseId },
    include: { _count: { select: { submissions: true } } },
  });
  res.json(assignment);
}));

// POST /api/admin/assignments/by-course/:courseId — buat tugas bila belum ada
adminAssignmentRouter.post("/by-course/:courseId", ...requireManage, wrap(async (req, res) => {
  const parsed = metaSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true } });
  if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const assignment = await prisma.assignment.upsert({
    where: { course_id: course.id },
    create: { course_id: course.id, ...parsed.data },
    update: parsed.data,
    include: { _count: { select: { submissions: true } } },
  });
  res.status(201).json(assignment);
}));

// PATCH /api/admin/assignments/:id
adminAssignmentRouter.patch("/:id", ...requireManage, wrap(async (req, res) => {
  const parsed = metaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const assignment = await prisma.assignment.update({
      where: { id: req.params.id },
      data: parsed.data,
      include: { _count: { select: { submissions: true } } },
    });
    res.json(assignment);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Tugas tidak ditemukan" });
    throw e;
  }
}));

// DELETE /api/admin/assignments/:id — termasuk seluruh pengumpulan & file-nya
adminAssignmentRouter.delete("/:id", ...requireManage, wrap(async (req, res) => {
  const assignment = await prisma.assignment.findUnique({
    where: { id: req.params.id },
    select: { id: true, submissions: { select: { file_path: true } } },
  });
  if (!assignment) return res.status(404).json({ error: "Tugas tidak ditemukan" });

  await prisma.assignment.delete({ where: { id: assignment.id } });
  await Promise.all(assignment.submissions.map((s) => removeSubmissionFile(s.file_path)));
  res.json({ ok: true });
}));

// GET /api/admin/assignments/:id/submissions
adminAssignmentRouter.get("/:id/submissions", ...requireManage, wrap(async (req, res) => {
  const submissions = await prisma.assignmentSubmission.findMany({
    where: { assignment_id: req.params.id },
    orderBy: { submitted_at: "desc" },
    select: {
      ...submissionSelect,
      user: { select: { id: true, email: true, profile: { select: { full_name: true, phone: true } } } },
    },
  });
  res.json(submissions);
}));
