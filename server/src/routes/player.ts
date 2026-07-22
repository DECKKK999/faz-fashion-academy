import { Router } from "express";
import type { Request } from "express";
import { prisma } from "../db.js";
import { optionalAuth, requireAuth } from "../auth.js";

export const playerRouter = Router();

// ====== helpers ======

function isManager(req: Request): boolean {
  return req.user?.roles.some((r) => r === "admin" || r === "instructor") ?? false;
}

const courseWithCurriculum = {
  modules: {
    orderBy: [{ position: "asc" as const }, { created_at: "asc" as const }],
    include: {
      lessons: {
        orderBy: [{ position: "asc" as const }, { created_at: "asc" as const }],
      },
    },
  },
};

type CourseRecord = Awaited<ReturnType<typeof loadCourse>>;

async function loadCourse(where: { id: string } | { slug: string }) {
  return prisma.course.findUnique({ where: where as any, include: courseWithCurriculum });
}

// Bangun payload PlayerCourse, dengan gating konten per-lesson.
async function buildPayload(course: NonNullable<CourseRecord>, userId: string | null, canManage: boolean) {
  let enrolled = false;
  if (userId) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: course.id } },
      select: { id: true },
    });
    enrolled = !!enrollment;
  }

  // Set lesson id yang sudah diselesaikan oleh user (jika login)
  const lessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  let completedSet = new Set<string>();
  if (userId && lessonIds.length > 0) {
    const progress = await prisma.lessonProgress.findMany({
      where: { user_id: userId, lesson_id: { in: lessonIds }, completed: true },
      select: { lesson_id: true },
    });
    completedSet = new Set(progress.map((p) => p.lesson_id));
  }

  const fullAccess = enrolled || canManage;

  const modules = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    position: m.position,
    lessons: m.lessons.map((l) => {
      const accessible = fullAccess || l.is_free_preview;
      const locked = !accessible;
      return {
        id: l.id,
        title: l.title,
        position: l.position,
        duration_minutes: l.duration_minutes,
        is_free_preview: l.is_free_preview,
        locked,
        completed: completedSet.has(l.id),
        // Konten/video hanya dikirim jika lesson dapat diakses (gating server-side)
        video_url: accessible ? l.video_url : null,
        content: accessible ? l.content : null,
      };
    }),
  }));

  const total_lessons = lessonIds.length;
  const completed_count = lessonIds.filter((id) => completedSet.has(id)).length;
  const progress_pct = total_lessons > 0 ? Math.round((completed_count / total_lessons) * 100) : 0;
  const all_lessons_done = total_lessons > 0 && completed_count >= total_lessons;

  // Ringkasan Final Quiz kelas (kalau ada) untuk kartu di sidebar player.
  const quizRecord = await prisma.quiz.findUnique({
    where: { course_id: course.id },
    select: {
      id: true,
      title: true,
      passing_score: true,
      is_published: true,
      _count: { select: { questions: true } },
    },
  });

  let quiz: {
    id: string;
    title: string;
    passing_score: number;
    total_questions: number;
    unlocked: boolean;
    passed: boolean;
    best_score: number | null;
  } | null = null;

  if (quizRecord && quizRecord._count.questions > 0 && (quizRecord.is_published || canManage)) {
    const best = userId
      ? await prisma.quizAttempt.findFirst({
          where: { quiz_id: quizRecord.id, user_id: userId },
          orderBy: [{ score: "desc" }, { submitted_at: "desc" }],
          select: { score: true, passed: true },
        })
      : null;
    quiz = {
      id: quizRecord.id,
      title: quizRecord.title,
      passing_score: quizRecord.passing_score,
      total_questions: quizRecord._count.questions,
      unlocked: canManage || (enrolled && all_lessons_done),
      passed: best?.passed ?? false,
      best_score: best?.score ?? null,
    };
  }

  // resume_lesson_id: lesson accessible pertama yang belum selesai; fallback lesson accessible pertama
  let resume_lesson_id: string | null = null;
  for (const m of modules) {
    for (const l of m.lessons) {
      if (l.locked) continue;
      if (resume_lesson_id === null) resume_lesson_id = l.id; // fallback pertama yang accessible
      if (!l.completed) {
        resume_lesson_id = l.id;
        return finalize();
      }
    }
  }
  return finalize();

  function finalize() {
    return {
      course: {
        id: course.id,
        slug: course.slug,
        title: course.title,
        subtitle: course.subtitle,
        cover_image_url: course.cover_image_url,
        instructor_name: course.instructor_name,
      },
      modules,
      access: { enrolled, can_manage: canManage },
      total_lessons,
      completed_count,
      progress_pct,
      resume_lesson_id,
      quiz,
    };
  }
}

// Verifikasi enrollment lewat lesson -> module -> course; kembalikan course_id bila enrolled/manager.
async function resolveLessonAccess(lessonId: string, userId: string, canManage: boolean) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, module: { select: { course_id: true } } },
  });
  if (!lesson) return { ok: false as const, status: 404, error: "Pelajaran tidak ditemukan" };
  const courseId = lesson.module.course_id;

  if (!canManage) {
    const enrollment = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
      select: { id: true },
    });
    if (!enrollment) return { ok: false as const, status: 403, error: "Kamu belum terdaftar di kelas ini" };
  }
  return { ok: true as const, courseId };
}

// Hitung ulang progress kelas & kembalikan ringkasan.
async function recomputeProgress(tx: typeof prisma | any, courseId: string, userId: string) {
  const lessons = await tx.lesson.findMany({
    where: { module: { course_id: courseId } },
    select: { id: true },
  });
  const total_lessons = lessons.length;
  const lessonIds = lessons.map((l: { id: string }) => l.id);

  let completed_count = 0;
  if (lessonIds.length > 0) {
    completed_count = await tx.lessonProgress.count({
      where: { user_id: userId, lesson_id: { in: lessonIds }, completed: true },
    });
  }
  const progress_pct = total_lessons > 0 ? Math.round((completed_count / total_lessons) * 100) : 0;
  const all_done = total_lessons > 0 && completed_count >= total_lessons;
  return { total_lessons, completed_count, progress_pct, all_done };
}

// ====== routes ======

// GET /api/player/courses/:courseId
playerRouter.get("/courses/:courseId", optionalAuth, async (req, res) => {
  const course = await loadCourse({ id: req.params.courseId });
  const canManage = isManager(req);
  if (!course || (!course.is_published && !canManage)) {
    return res.status(404).json({ error: "Kelas tidak ditemukan" });
  }
  const payload = await buildPayload(course, req.user?.id ?? null, canManage);
  res.json(payload);
});

// GET /api/player/courses/by-slug/:slug
playerRouter.get("/courses/by-slug/:slug", optionalAuth, async (req, res) => {
  const course = await loadCourse({ slug: req.params.slug });
  const canManage = isManager(req);
  if (!course || (!course.is_published && !canManage)) {
    return res.status(404).json({ error: "Kelas tidak ditemukan" });
  }
  const payload = await buildPayload(course, req.user?.id ?? null, canManage);
  res.json(payload);
});

// GET /api/player/courses/:courseId/progress
playerRouter.get("/courses/:courseId/progress", requireAuth, async (req, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.courseId }, select: { id: true } });
  if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: req.user!.id, course_id: course.id } },
    select: { completed_at: true },
  });

  const summary = await recomputeProgress(prisma, course.id, req.user!.id);
  res.json({
    completed_count: summary.completed_count,
    total_lessons: summary.total_lessons,
    progress_pct: summary.progress_pct,
    completed_at: enrollment?.completed_at ? enrollment.completed_at.toISOString() : null,
  });
});

// POST /api/player/lessons/:lessonId/complete
playerRouter.post("/lessons/:lessonId/complete", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const canManage = isManager(req);
  const access = await resolveLessonAccess(req.params.lessonId, userId, canManage);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const result = await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: req.params.lessonId } },
      create: { user_id: userId, lesson_id: req.params.lessonId, completed: true, completed_at: new Date() },
      update: { completed: true, completed_at: new Date() },
    });

    const summary = await recomputeProgress(tx, access.courseId, userId);

    // Tandai enrollment selesai bila semua lesson selesai (enrollment mungkin tidak ada untuk manager)
    const enrollment = await tx.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: access.courseId } },
      select: { id: true, completed_at: true },
    });
    if (enrollment && summary.all_done && !enrollment.completed_at) {
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { completed_at: new Date() } });
    }
    return summary;
  });

  res.json({
    lesson_id: req.params.lessonId,
    completed: true,
    completed_at: new Date().toISOString(),
    progress_pct: result.progress_pct,
    completed_count: result.completed_count,
    total_lessons: result.total_lessons,
    course_completed: result.all_done,
  });
});

// POST /api/player/lessons/:lessonId/incomplete
playerRouter.post("/lessons/:lessonId/incomplete", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const canManage = isManager(req);
  const access = await resolveLessonAccess(req.params.lessonId, userId, canManage);
  if (!access.ok) return res.status(access.status).json({ error: access.error });

  const result = await prisma.$transaction(async (tx) => {
    await tx.lessonProgress.upsert({
      where: { user_id_lesson_id: { user_id: userId, lesson_id: req.params.lessonId } },
      create: { user_id: userId, lesson_id: req.params.lessonId, completed: false, completed_at: null },
      update: { completed: false, completed_at: null },
    });

    const summary = await recomputeProgress(tx, access.courseId, userId);

    // Bersihkan completed_at enrollment karena tidak lagi semua selesai
    const enrollment = await tx.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: access.courseId } },
      select: { id: true, completed_at: true },
    });
    if (enrollment && enrollment.completed_at && !summary.all_done) {
      await tx.enrollment.update({ where: { id: enrollment.id }, data: { completed_at: null } });
    }
    return summary;
  });

  res.json({
    lesson_id: req.params.lessonId,
    completed: false,
    completed_at: null,
    progress_pct: result.progress_pct,
    completed_count: result.completed_count,
    total_lessons: result.total_lessons,
    course_completed: result.all_done,
  });
});
