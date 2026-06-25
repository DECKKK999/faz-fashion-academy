import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { optionalAuth, requireAuth, requireAdmin } from "../auth.js";

// reviewsRouter is mounted at /api/courses — only define non-colliding subpaths here.
export const reviewsRouter = Router();
// adminReviewsRouter is mounted at /api/admin/reviews.
export const adminReviewsRouter = Router();

type DistributionKey = "1" | "2" | "3" | "4" | "5";
type Distribution = Record<DistributionKey, number>;

// Mask an email like "andi@example.com" -> "an***@example.com"
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "Pengguna";
  const visible = local.slice(0, 2);
  return `${visible}${"*".repeat(Math.max(1, local.length - 2))}@${domain}`;
}

function reviewerName(profile: { full_name: string | null } | null | undefined, email: string): string {
  return profile?.full_name?.trim() || maskEmail(email);
}

// Recompute Course.rating + Course.reviews_count from live review rows. Runs inside the caller's tx.
async function recomputeCourse(tx: typeof prisma, courseId: string) {
  const agg = await tx.review.aggregate({
    where: { course_id: courseId },
    _avg: { rating: true },
    _count: { _all: true },
  });
  const count = agg._count._all;
  await tx.course.update({
    where: { id: courseId },
    data: {
      reviews_count: count,
      rating: count > 0 && agg._avg.rating != null ? Math.round(agg._avg.rating * 10) / 10 : null,
    },
  });
}

async function buildAggregate(courseId: string): Promise<{ average: number | null; count: number; distribution: Distribution }> {
  const grouped = await prisma.review.groupBy({
    by: ["rating"],
    where: { course_id: courseId },
    _count: { _all: true },
  });
  const distribution: Distribution = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  let total = 0;
  let sum = 0;
  for (const g of grouped) {
    const key = String(g.rating) as DistributionKey;
    if (key in distribution) distribution[key] = g._count._all;
    total += g._count._all;
    sum += g.rating * g._count._all;
  }
  return {
    average: total > 0 ? Math.round((sum / total) * 10) / 10 : null,
    count: total,
    distribution,
  };
}

function shapeReview(r: {
  id: string;
  user_id: string;
  course_id: string;
  rating: number;
  body: string | null;
  created_at: Date;
  user: { email: string; profile: { full_name: string | null; avatar_url: string | null } | null };
}) {
  return {
    id: r.id,
    user_id: r.user_id,
    course_id: r.course_id,
    rating: r.rating,
    body: r.body,
    created_at: r.created_at,
    reviewer: {
      full_name: reviewerName(r.user.profile, r.user.email),
      avatar_url: r.user.profile?.avatar_url ?? null,
    },
  };
}

const reviewerInclude = {
  user: { select: { email: true, profile: { select: { full_name: true, avatar_url: true } } } },
} as const;

// ============ PUBLIC / BUYER (mounted at /api/courses) ============

// GET /api/courses/:id/reviews
reviewsRouter.get("/:id/reviews", optionalAuth, async (req, res) => {
  const courseId = req.params.id;
  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const [rows, aggregate] = await Promise.all([
    prisma.review.findMany({
      where: { course_id: courseId },
      include: reviewerInclude,
      orderBy: { created_at: "desc" },
    }),
    buildAggregate(courseId),
  ]);

  const reviews = rows.map(shapeReview);

  let my_review: ReturnType<typeof shapeReview> | null = null;
  if (req.user) {
    const mine = rows.find((r) => r.user_id === req.user!.id);
    my_review = mine ? shapeReview(mine) : null;
  }

  res.json({ reviews, aggregate, my_review });
});

const upsertSchema = z.object({
  rating: z.number().int().min(1, "Rating minimal 1").max(5, "Rating maksimal 5"),
  body: z.string().trim().max(2000, "Ulasan terlalu panjang").nullable().optional(),
});

// POST /api/courses/:id/reviews — upsert (must be enrolled)
reviewsRouter.post("/:id/reviews", requireAuth, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user!.id;

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const course = await prisma.course.findUnique({ where: { id: courseId }, select: { id: true } });
  if (!course) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const enrollment = await prisma.enrollment.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    select: { id: true },
  });
  if (!enrollment) return res.status(403).json({ error: "Kamu harus terdaftar di kelas ini untuk memberi ulasan" });

  const body = parsed.data.body?.trim() ? parsed.data.body.trim() : null;

  const saved = await prisma.$transaction(async (tx) => {
    const review = await tx.review.upsert({
      where: { user_id_course_id: { user_id: userId, course_id: courseId } },
      create: { user_id: userId, course_id: courseId, rating: parsed.data.rating, body },
      update: { rating: parsed.data.rating, body },
      include: reviewerInclude,
    });
    await recomputeCourse(tx as unknown as typeof prisma, courseId);
    return review;
  });

  res.status(201).json(shapeReview(saved));
});

// DELETE /api/courses/:id/reviews/me — remove the current user's review
reviewsRouter.delete("/:id/reviews/me", requireAuth, async (req, res) => {
  const courseId = req.params.id;
  const userId = req.user!.id;

  const existing = await prisma.review.findUnique({
    where: { user_id_course_id: { user_id: userId, course_id: courseId } },
    select: { id: true },
  });
  if (!existing) return res.status(404).json({ error: "Ulasan tidak ditemukan" });

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: existing.id } });
    await recomputeCourse(tx as unknown as typeof prisma, courseId);
  });

  res.json({ ok: true });
});

// ============ ADMIN (mounted at /api/admin/reviews) ============

// GET /api/admin/reviews?course_id=
adminReviewsRouter.get("/", ...requireAdmin, async (req, res) => {
  const courseId = typeof req.query.course_id === "string" && req.query.course_id ? req.query.course_id : undefined;
  const rows = await prisma.review.findMany({
    where: courseId ? { course_id: courseId } : {},
    include: {
      course: { select: { id: true, title: true, slug: true } },
      user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
    },
    orderBy: { created_at: "desc" },
  });
  res.json(rows);
});

// DELETE /api/admin/reviews/:reviewId — moderate, then recompute owning course
adminReviewsRouter.delete("/:reviewId", ...requireAdmin, async (req, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.reviewId },
    select: { id: true, course_id: true },
  });
  if (!review) return res.status(404).json({ error: "Ulasan tidak ditemukan" });

  await prisma.$transaction(async (tx) => {
    await tx.review.delete({ where: { id: review.id } });
    await recomputeCourse(tx as unknown as typeof prisma, review.course_id);
  });

  res.json({ ok: true });
});
