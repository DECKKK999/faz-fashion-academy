import { Router } from "express";
import type { Request } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireManage } from "../auth.js";

export const quizRouter = Router();
export const adminQuizRouter = Router();

// ---------- helpers ----------

function isManager(req: Request): boolean {
  return req.user?.roles.some((r) => r === "admin" || r === "instructor") ?? false;
}

const questionOrder = [{ position: "asc" as const }, { created_at: "asc" as const }];
const optionOrder = [{ position: "asc" as const }, { created_at: "asc" as const }];

/** Bentuk kuis untuk admin/instruktur — termasuk kunci jawaban. */
const adminQuizInclude = {
  questions: {
    orderBy: questionOrder,
    include: { options: { orderBy: optionOrder } },
  },
} as const;

/** Hitung pelajaran kelas & berapa yang sudah diselesaikan user. */
export async function lessonCompletion(userId: string, courseId: string) {
  const [total, completed] = await Promise.all([
    prisma.lesson.count({ where: { module: { course_id: courseId } } }),
    prisma.lessonProgress.count({
      where: { user_id: userId, completed: true, lesson: { module: { course_id: courseId } } },
    }),
  ]);
  return { total, completed, all_done: total > 0 && completed >= total };
}

/**
 * Status kuis sebuah kelas untuk seorang user.
 * `required` hanya true bila kuis ada, dipublikasikan, dan punya minimal 1 soal —
 * kelas tanpa kuis tetap bisa menerbitkan sertifikat seperti sebelumnya.
 */
export async function quizGate(userId: string, courseId: string) {
  const quiz = await prisma.quiz.findUnique({
    where: { course_id: courseId },
    select: {
      id: true,
      title: true,
      passing_score: true,
      is_published: true,
      _count: { select: { questions: true } },
    },
  });

  if (!quiz || !quiz.is_published || quiz._count.questions === 0) {
    return {
      required: false,
      passed: true,
      quiz_id: quiz?.id ?? null,
      passing_score: quiz?.passing_score ?? null,
      best_score: null as number | null,
      attempts_count: 0,
    };
  }

  const [best, attempts_count] = await Promise.all([
    prisma.quizAttempt.findFirst({
      where: { quiz_id: quiz.id, user_id: userId },
      orderBy: [{ score: "desc" }, { submitted_at: "desc" }],
      select: { score: true, passed: true },
    }),
    prisma.quizAttempt.count({ where: { quiz_id: quiz.id, user_id: userId } }),
  ]);

  return {
    required: true,
    passed: best?.passed ?? false,
    quiz_id: quiz.id,
    passing_score: quiz.passing_score,
    best_score: best?.score ?? null,
    attempts_count,
  };
}

// ============ PESERTA ============

type QuizCourse = { id: string; slug: string; title: string; is_published: boolean };

/** Status kuis + soal (tanpa kunci jawaban) untuk seorang user. */
async function buildQuizState(course: QuizCourse, userId: string, canManage: boolean) {
  const quiz = await prisma.quiz.findUnique({
    where: { course_id: course.id },
    include: {
      questions: {
        orderBy: questionOrder,
        include: { options: { orderBy: optionOrder, select: { id: true, text: true, position: true } } },
      },
    },
  });

  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: course.id } },
    select: { id: true },
  });
  const enrolled = !!enrollment;
  const lessons = await lessonCompletion(userId, course.id);

  if (!quiz || (!quiz.is_published && !canManage) || quiz.questions.length === 0) {
    return {
      course: { id: course.id, slug: course.slug, title: course.title },
      quiz: null,
      access: { enrolled, can_manage: canManage },
      lessons,
      unlocked: false,
      questions: [],
      attempts: [],
      best_attempt: null,
      passed: false,
    };
  }

  // Kuis terbuka setelah semua pelajaran selesai (pengelola selalu bisa melihat).
  const unlocked = canManage || (enrolled && lessons.all_done);

  const attempts = await prisma.quizAttempt.findMany({
    where: { quiz_id: quiz.id, user_id: userId },
    orderBy: { submitted_at: "desc" },
    select: {
      id: true,
      score: true,
      correct_count: true,
      total_questions: true,
      passing_score: true,
      passed: true,
      submitted_at: true,
    },
  });
  const best_attempt =
    attempts.length > 0 ? [...attempts].sort((a, b) => b.score - a.score)[0] : null;

  return {
    course: { id: course.id, slug: course.slug, title: course.title },
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      passing_score: quiz.passing_score,
      total_questions: quiz.questions.length,
    },
    access: { enrolled, can_manage: canManage },
    lessons,
    unlocked,
    // Soal hanya dikirim bila kuis sudah terbuka (gating server-side).
    questions: unlocked
      ? quiz.questions.map((q) => ({
          id: q.id,
          prompt: q.prompt,
          position: q.position,
          options: q.options,
        }))
      : [],
    attempts,
    best_attempt,
    passed: attempts.some((a) => a.passed),
  };
}

const courseSelect = { id: true, slug: true, title: true, is_published: true } as const;

// GET /api/quizzes/by-course/:courseId
quizRouter.get("/by-course/:courseId", requireAuth, async (req, res) => {
  const canManage = isManager(req);
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: courseSelect });
  if (!course || (!course.is_published && !canManage)) {
    return res.status(404).json({ error: "Kelas tidak ditemukan" });
  }
  res.json(await buildQuizState(course, req.user!.id, canManage));
});

// GET /api/quizzes/by-course-slug/:slug
quizRouter.get("/by-course-slug/:slug", requireAuth, async (req, res) => {
  const canManage = isManager(req);
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug }, select: courseSelect });
  if (!course || (!course.is_published && !canManage)) {
    return res.status(404).json({ error: "Kelas tidak ditemukan" });
  }
  res.json(await buildQuizState(course, req.user!.id, canManage));
});

// POST /api/quizzes/:quizId/submit { answers: [{ question_id, option_id }] }
quizRouter.post("/:quizId/submit", requireAuth, async (req, res) => {
  const parsed = z
    .object({
      answers: z
        .array(z.object({ question_id: z.string().uuid(), option_id: z.string().uuid() }))
        .min(1),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Jawaban tidak valid" });

  const userId = req.user!.id;
  const canManage = isManager(req);

  const quiz = await prisma.quiz.findUnique({
    where: { id: req.params.quizId },
    include: {
      questions: { orderBy: questionOrder, include: { options: { orderBy: optionOrder } } },
    },
  });
  if (!quiz || (!quiz.is_published && !canManage)) {
    return res.status(404).json({ error: "Kuis tidak ditemukan" });
  }
  if (quiz.questions.length === 0) {
    return res.status(409).json({ error: "Kuis belum memiliki soal" });
  }

  if (!canManage) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: quiz.course_id } },
      select: { id: true },
    });
    if (!enrollment) return res.status(403).json({ error: "Kamu belum terdaftar di kelas ini" });

    const lessons = await lessonCompletion(userId, quiz.course_id);
    if (!lessons.all_done) {
      return res.status(403).json({
        error: "Selesaikan semua pelajaran terlebih dahulu sebelum mengerjakan Final Quiz",
        ...lessons,
      });
    }
  }

  // Petakan jawaban terakhir per soal (abaikan duplikat kiriman).
  const answerByQuestion = new Map<string, string>();
  for (const a of parsed.data.answers) answerByQuestion.set(a.question_id, a.option_id);

  const unanswered = quiz.questions.filter((q) => !answerByQuestion.has(q.id));
  if (unanswered.length > 0) {
    return res
      .status(400)
      .json({ error: `Masih ada ${unanswered.length} soal yang belum dijawab` });
  }

  const graded = quiz.questions.map((q) => {
    const optionId = answerByQuestion.get(q.id)!;
    const option = q.options.find((o) => o.id === optionId);
    return {
      question_id: q.id,
      // Opsi yang tidak milik soal ini dianggap tidak dijawab (salah).
      option_id: option ? option.id : null,
      is_correct: option?.is_correct ?? false,
    };
  });

  const total_questions = graded.length;
  const correct_count = graded.filter((g) => g.is_correct).length;
  const score = Math.round((correct_count / total_questions) * 100);
  const passed = score >= quiz.passing_score;

  const attempt = await prisma.quizAttempt.create({
    data: {
      quiz_id: quiz.id,
      user_id: userId,
      score,
      correct_count,
      total_questions,
      passing_score: quiz.passing_score,
      passed,
      answers: { create: graded },
    },
    select: { id: true, submitted_at: true },
  });

  res.status(201).json({
    attempt_id: attempt.id,
    submitted_at: attempt.submitted_at,
    score,
    correct_count,
    total_questions,
    passing_score: quiz.passing_score,
    passed,
    // Hanya benar/salah per soal — kunci jawaban tidak dibocorkan.
    results: graded.map((g, i) => ({ question_id: g.question_id, number: i + 1, is_correct: g.is_correct })),
  });
});

// GET /api/quizzes/:quizId/attempts — riwayat percobaan milik sendiri
quizRouter.get("/:quizId/attempts", requireAuth, async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quiz_id: req.params.quizId, user_id: req.user!.id },
    orderBy: { submitted_at: "desc" },
    select: {
      id: true,
      score: true,
      correct_count: true,
      total_questions: true,
      passing_score: true,
      passed: true,
      submitted_at: true,
    },
  });
  res.json(attempts);
});

// ============ ADMIN / INSTRUKTUR ============

const optionInputSchema = z.object({
  text: z.string().trim().min(1, "Teks pilihan wajib diisi"),
  is_correct: z.boolean().default(false),
});

const quizMetaSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().nullable().optional(),
  passing_score: z.number().int().min(0).max(100).optional(),
  is_published: z.boolean().optional(),
});

// GET /api/admin/quizzes/by-course/:courseId — termasuk kunci jawaban
adminQuizRouter.get("/by-course/:courseId", ...requireManage, async (req, res) => {
  const quiz = await prisma.quiz.findUnique({
    where: { course_id: req.params.courseId },
    include: adminQuizInclude,
  });
  res.json(quiz);
});

// POST /api/admin/quizzes/by-course/:courseId — buat kuis bila belum ada
adminQuizRouter.post("/by-course/:courseId", ...requireManage, async (req, res) => {
  const parsed = quizMetaSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true } });
  if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const quiz = await prisma.quiz.upsert({
    where: { course_id: course.id },
    create: { course_id: course.id, ...parsed.data },
    update: parsed.data,
    include: adminQuizInclude,
  });
  res.status(201).json(quiz);
});

// PATCH /api/admin/quizzes/:quizId
adminQuizRouter.patch("/:quizId", ...requireManage, async (req, res) => {
  const parsed = quizMetaSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const quiz = await prisma.quiz.update({
      where: { id: req.params.quizId },
      data: parsed.data,
      include: adminQuizInclude,
    });
    res.json(quiz);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Kuis tidak ditemukan" });
    throw e;
  }
});

// DELETE /api/admin/quizzes/:quizId — hapus kuis beserta soal & percobaan
adminQuizRouter.delete("/:quizId", ...requireManage, async (req, res) => {
  try {
    await prisma.quiz.delete({ where: { id: req.params.quizId } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Kuis tidak ditemukan" });
    throw e;
  }
});

// POST /api/admin/quizzes/:quizId/questions
adminQuizRouter.post("/:quizId/questions", ...requireManage, async (req, res) => {
  const parsed = z
    .object({
      prompt: z.string().trim().min(1).default("Soal baru"),
      explanation: z.string().nullable().optional(),
      options: z.array(optionInputSchema).min(2).max(8).optional(),
    })
    .safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId }, select: { id: true } });
  if (!quiz) return res.status(404).json({ error: "Kuis tidak ditemukan" });

  const count = await prisma.quizQuestion.count({ where: { quiz_id: quiz.id } });
  const options = parsed.data.options ?? [
    { text: "Pilihan A", is_correct: true },
    { text: "Pilihan B", is_correct: false },
    { text: "Pilihan C", is_correct: false },
    { text: "Pilihan D", is_correct: false },
  ];

  const question = await prisma.quizQuestion.create({
    data: {
      quiz_id: quiz.id,
      prompt: parsed.data.prompt,
      explanation: parsed.data.explanation ?? null,
      position: count,
      options: { create: options.map((o, i) => ({ text: o.text, is_correct: o.is_correct, position: i })) },
    },
    include: { options: { orderBy: optionOrder } },
  });
  res.status(201).json(question);
});

// PATCH /api/admin/quiz-questions/:id — `options` (bila dikirim) mengganti seluruh pilihan
adminQuizRouter.patch("/questions/:id", ...requireManage, async (req, res) => {
  const parsed = z
    .object({
      prompt: z.string().trim().min(1).optional(),
      explanation: z.string().nullable().optional(),
      position: z.number().int().min(0).optional(),
      options: z.array(optionInputSchema).min(2).max(8).optional(),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const { options, ...fields } = parsed.data;
  if (options && options.filter((o) => o.is_correct).length !== 1) {
    return res.status(400).json({ error: "Tepat satu pilihan harus ditandai sebagai jawaban benar" });
  }

  const existing = await prisma.quizQuestion.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!existing) return res.status(404).json({ error: "Soal tidak ditemukan" });

  const question = await prisma.$transaction(async (tx) => {
    if (options) {
      await tx.quizOption.deleteMany({ where: { question_id: existing.id } });
      await tx.quizOption.createMany({
        data: options.map((o, i) => ({
          question_id: existing.id,
          text: o.text,
          is_correct: o.is_correct,
          position: i,
        })),
      });
    }
    return tx.quizQuestion.update({
      where: { id: existing.id },
      data: fields,
      include: { options: { orderBy: optionOrder } },
    });
  });

  res.json(question);
});

// DELETE /api/admin/quiz-questions/:id
adminQuizRouter.delete("/questions/:id", ...requireManage, async (req, res) => {
  try {
    await prisma.quizQuestion.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Soal tidak ditemukan" });
    throw e;
  }
});

// GET /api/admin/quizzes/:quizId/attempts — rekap percobaan semua peserta
adminQuizRouter.get("/:quizId/attempts", ...requireManage, async (req, res) => {
  const attempts = await prisma.quizAttempt.findMany({
    where: { quiz_id: req.params.quizId },
    orderBy: { submitted_at: "desc" },
    take: 200,
    select: {
      id: true,
      score: true,
      correct_count: true,
      total_questions: true,
      passing_score: true,
      passed: true,
      submitted_at: true,
      user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
    },
  });
  res.json(attempts);
});
