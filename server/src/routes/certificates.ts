import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { generateCertificatePdf } from "../lib/certificate-pdf.js";
import { quizGate } from "./quiz.js";

export const certificatesRouter = Router();
export const adminCertificatesRouter = Router();

// ---------- helpers ----------

const courseSelect = {
  id: true,
  slug: true,
  title: true,
  cover_image_url: true,
  level: true,
  category: true,
  instructor_name: true,
};

// Public certificate shape (own list / detail) — no other-user PII.
const ownSelect = {
  id: true,
  certificate_number: true,
  recipient_name: true,
  course_title: true,
  instructor_name: true,
  quiz_score: true,
  issued_at: true,
  revoked: true,
  revoked_at: true,
  revoked_reason: true,
  course: { select: courseSelect },
};

// Admin shape — includes the recipient user.
const adminSelect = {
  ...ownSelect,
  user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
};

function isAdmin(req: { user?: { roles: string[] } }) {
  return req.user?.roles.includes("admin") ?? false;
}

function generateCertificateNumber(): string {
  const year = new Date().getFullYear();
  const rand = randomBytes(4).toString("hex").toUpperCase(); // 8 hex chars
  return `FAZ-${year}-${rand}`;
}

async function recipientName(userId: string, email: string): Promise<string> {
  const p = await prisma.profile.findUnique({ where: { user_id: userId }, select: { full_name: true } });
  return p?.full_name?.trim() || email.split("@")[0];
}

/** Counts total lessons of a course and how many the user has completed. */
async function courseCompletion(userId: string, courseId: string) {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { module: { course_id: courseId } } }),
    prisma.lessonProgress.count({
      where: { user_id: userId, completed: true, lesson: { module: { course_id: courseId } } },
    }),
  ]);
  return { total, completed };
}

// ============ BUYER / STUDENT ============

// GET /api/certificates — sertifikat milik user saat ini
certificatesRouter.get("/", requireAuth, async (req, res) => {
  const certificates = await prisma.certificate.findMany({
    where: { user_id: req.user!.id },
    orderBy: { issued_at: "desc" },
    select: ownSelect,
  });

  // Kelas yang sudah selesai (100%) namun belum punya sertifikat → bisa diterbitkan.
  const enrollments = await prisma.enrollment.findMany({
    where: { user_id: req.user!.id },
    select: { course_id: true, course: { select: courseSelect } },
  });
  const issuedCourseIds = new Set(certificates.map((c) => c.course?.id).filter(Boolean) as string[]);

  type EnrolledCourse = typeof enrollments[number]["course"];
  const eligible: { course: EnrolledCourse; completed: number; total: number; quiz_score: number | null }[] = [];
  // Materi sudah 100% tapi Final Quiz belum lulus → sertifikat belum bisa terbit.
  const quiz_pending: {
    course: EnrolledCourse;
    completed: number;
    total: number;
    quiz: { id: string; passing_score: number; best_score: number | null; attempts_count: number };
  }[] = [];

  for (const e of enrollments) {
    if (issuedCourseIds.has(e.course_id)) continue;
    const { total, completed } = await courseCompletion(req.user!.id, e.course_id);
    if (!(total > 0 && completed >= total)) continue;

    const gate = await quizGate(req.user!.id, e.course_id);
    if (gate.required && !gate.passed) {
      quiz_pending.push({
        course: e.course,
        completed,
        total,
        quiz: {
          id: gate.quiz_id!,
          passing_score: gate.passing_score!,
          best_score: gate.best_score,
          attempts_count: gate.attempts_count,
        },
      });
    } else {
      eligible.push({ course: e.course, completed, total, quiz_score: gate.best_score });
    }
  }

  res.json({ certificates, eligible, quiz_pending });
});

// POST /api/certificates/issue { course_id }
certificatesRouter.post("/issue", requireAuth, async (req, res) => {
  const parsed = z.object({ course_id: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "course_id tidak valid" });
  const { course_id } = parsed.data;
  const userId = req.user!.id;

  const course = await prisma.course.findUnique({ where: { id: course_id } });
  if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id } },
  });
  if (!enrollment) return res.status(403).json({ error: "Kamu belum terdaftar pada kelas ini" });

  // Idempotent: kalau sertifikat sudah ada, kembalikan apa adanya.
  const existing = await prisma.certificate.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id } },
    select: ownSelect,
  });
  if (existing) return res.status(200).json(existing);

  const { total, completed } = await courseCompletion(userId, course_id);
  if (!(total > 0 && completed >= total)) {
    return res.status(409).json({ error: "Kelas belum selesai 100%", completed, total });
  }

  // Kelas yang punya Final Quiz aktif wajib lulus dulu sebelum sertifikat terbit.
  const gate = await quizGate(userId, course_id);
  if (gate.required && !gate.passed) {
    return res.status(409).json({
      error: `Kamu belum lulus Final Quiz kelas ini (minimal ${gate.passing_score})`,
      passing_score: gate.passing_score,
      best_score: gate.best_score,
      quiz_id: gate.quiz_id,
    });
  }

  const name = await recipientName(userId, req.user!.email);

  const certificate = await prisma.$transaction(async (tx) => {
    // Tandai enrollment selesai jika belum.
    if (!enrollment.completed_at) {
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { completed_at: new Date() } });
    }
    // Upsert idempoten berdasarkan @@unique([user_id, course_id]).
    return tx.certificate.upsert({
      where: { user_id_course_id: { user_id: userId, course_id } },
      create: {
        certificate_number: generateCertificateNumber(),
        user_id: userId,
        course_id,
        enrollment_id: enrollment.id,
        recipient_name: name,
        course_title: course.title,
        instructor_name: course.instructor_name ?? null,
        quiz_score: gate.best_score,
      },
      update: {},
      select: ownSelect,
    });
  });

  res.status(201).json(certificate);
});

// GET /api/certificates/:id — pemilik atau admin
certificatesRouter.get("/:id", requireAuth, async (req, res) => {
  const admin = isAdmin(req);
  const certificate = await prisma.certificate.findUnique({
    where: { id: req.params.id },
    select: admin ? adminSelect : ownSelect,
  });
  if (!certificate) return res.status(404).json({ error: "Sertifikat tidak ditemukan" });

  if (!admin) {
    const owner = await prisma.certificate.findUnique({ where: { id: req.params.id }, select: { user_id: true } });
    if (owner?.user_id !== req.user!.id) return res.status(404).json({ error: "Sertifikat tidak ditemukan" });
  }
  res.json(certificate);
});

// GET /api/certificates/:id/download — stream PDF (pemilik atau admin)
certificatesRouter.get("/:id/download", requireAuth, async (req, res) => {
  const certificate = await prisma.certificate.findUnique({
    where: { id: req.params.id },
    select: {
      user_id: true,
      certificate_number: true,
      recipient_name: true,
      course_title: true,
      instructor_name: true,
      quiz_score: true,
      issued_at: true,
      revoked: true,
    },
  });
  if (!certificate) return res.status(404).json({ error: "Sertifikat tidak ditemukan" });
  if (certificate.user_id !== req.user!.id && !isAdmin(req)) {
    return res.status(404).json({ error: "Sertifikat tidak ditemukan" });
  }

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="sertifikat-${certificate.certificate_number}.pdf"`,
  );

  try {
    await generateCertificatePdf(
      {
        certificate_number: certificate.certificate_number,
        recipient_name: certificate.recipient_name,
        course_title: certificate.course_title,
        instructor_name: certificate.instructor_name,
        quiz_score: certificate.quiz_score,
        issued_at: certificate.issued_at,
        revoked: certificate.revoked,
      },
      res,
    );
  } catch (e) {
    // Stream mungkin sudah sebagian terkirim; pastikan koneksi ditutup.
    if (!res.headersSent) res.status(500).json({ error: "Gagal membuat PDF sertifikat" });
    else res.end();
  }
});

// GET /api/certificates/verify/:certificateNumber — PUBLIK, tanpa PII selain yang tercetak di sertifikat
certificatesRouter.get("/verify/:certificateNumber", async (req, res) => {
  const certificate = await prisma.certificate.findUnique({
    where: { certificate_number: req.params.certificateNumber },
    select: {
      certificate_number: true,
      recipient_name: true,
      course_title: true,
      instructor_name: true,
      issued_at: true,
      revoked: true,
      revoked_at: true,
    },
  });

  if (!certificate) return res.status(404).json({ valid: false });

  res.json({
    valid: true,
    revoked: certificate.revoked,
    certificate_number: certificate.certificate_number,
    recipient_name: certificate.recipient_name,
    course_title: certificate.course_title,
    instructor_name: certificate.instructor_name,
    issued_at: certificate.issued_at,
    revoked_at: certificate.revoked_at,
  });
});

// ============ ADMIN ============

// GET /api/admin/certificates?q=&revoked=
adminCertificatesRouter.get("/", ...requireAdmin, async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const revokedParam = typeof req.query.revoked === "string" ? req.query.revoked : "";

  const where: any = {};
  if (revokedParam === "true") where.revoked = true;
  else if (revokedParam === "false") where.revoked = false;

  if (q) {
    where.OR = [
      { certificate_number: { contains: q, mode: "insensitive" } },
      { recipient_name: { contains: q, mode: "insensitive" } },
      { course_title: { contains: q, mode: "insensitive" } },
      { user: { email: { contains: q, mode: "insensitive" } } },
    ];
  }

  const certificates = await prisma.certificate.findMany({
    where,
    orderBy: { issued_at: "desc" },
    select: adminSelect,
  });
  res.json(certificates);
});

// PATCH /api/admin/certificates/:id/revoke { revoked, reason? }
adminCertificatesRouter.patch("/:id/revoke", ...requireAdmin, async (req, res) => {
  const parsed = z
    .object({ revoked: z.boolean(), reason: z.string().trim().min(1).optional() })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Data tidak valid" });
  const { revoked, reason } = parsed.data;

  try {
    const certificate = await prisma.certificate.update({
      where: { id: req.params.id },
      data: revoked
        ? { revoked: true, revoked_at: new Date(), revoked_reason: reason ?? null }
        : { revoked: false, revoked_at: null, revoked_reason: null },
      select: adminSelect,
    });
    res.json(certificate);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Sertifikat tidak ditemukan" });
    throw e;
  }
});
