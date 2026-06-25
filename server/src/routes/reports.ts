import { Router } from "express";
import { Prisma } from "@prisma/client";
import { prisma } from "../db.js";
import { requireAdmin } from "../auth.js";

export const reportsRouter = Router();

// ============ Range helpers ============

type Range = "30d" | "90d" | "12m" | "all";

function parseRange(value: unknown): Range {
  if (value === "30d" || value === "90d" || value === "12m" || value === "all") return value;
  return "30d";
}

// Mengembalikan tanggal awal (inklusif) untuk range terpilih; null untuk "all".
function rangeStart(range: Range): Date | null {
  const now = Date.now();
  switch (range) {
    case "30d":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "90d":
      return new Date(now - 90 * 24 * 60 * 60 * 1000);
    case "12m": {
      const d = new Date();
      d.setMonth(d.getMonth() - 12);
      return d;
    }
    case "all":
    default:
      return null;
  }
}

// Bucket default per range: harian untuk rentang pendek, bulanan untuk rentang panjang.
function defaultBucket(range: Range): "day" | "month" {
  return range === "12m" || range === "all" ? "month" : "day";
}

function parseBucket(value: unknown, range: Range): "day" | "month" {
  if (value === "day" || value === "month") return value;
  return defaultBucket(range);
}

const JAKARTA_TZ = "Asia/Jakarta";

// Format bucket label di zona Asia/Jakarta (YYYY-MM-DD untuk hari, YYYY-MM untuk bulan).
function jakartaPeriod(date: Date, bucket: "day" | "month"): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: JAKARTA_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const y = get("year");
  const m = get("month");
  const d = get("day");
  return bucket === "month" ? `${y}-${m}` : `${y}-${m}-${d}`;
}

// Membuat daftar period berurutan (zero-fill) dari start..now di zona Asia/Jakarta.
function buildBuckets(start: Date | null, bucket: "day" | "month"): string[] {
  const now = new Date();
  // Jika "all" tanpa start, mulai 12 periode lalu agar grafik tetap bermakna.
  const begin = start
    ? new Date(start)
    : bucket === "month"
      ? new Date(now.getFullYear(), now.getMonth() - 11, 1)
      : new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000);

  const labels: string[] = [];
  const seen = new Set<string>();

  if (bucket === "month") {
    // Iterasi per bulan kalender.
    const cur = new Date(begin.getFullYear(), begin.getMonth(), 1);
    const endLabel = jakartaPeriod(now, "month");
    // Batasi iterasi untuk keamanan.
    for (let i = 0; i < 240; i++) {
      const label = jakartaPeriod(cur, "month");
      if (!seen.has(label)) {
        labels.push(label);
        seen.add(label);
      }
      if (label >= endLabel) break;
      cur.setMonth(cur.getMonth() + 1);
    }
  } else {
    const cur = new Date(begin);
    const endLabel = jakartaPeriod(now, "day");
    for (let i = 0; i < 1000; i++) {
      const label = jakartaPeriod(cur, "day");
      if (!seen.has(label)) {
        labels.push(label);
        seen.add(label);
      }
      if (label >= endLabel) break;
      cur.setTime(cur.getTime() + 24 * 60 * 60 * 1000);
    }
  }
  return labels;
}

// ============ GET /summary ============

reportsRouter.get("/summary", ...requireAdmin, async (req, res) => {
  const range = parseRange(req.query.range);
  const start = rangeStart(range);
  const verifiedInRange = start ? { gte: start } : undefined;

  const [revAll, revRange, paidAll, paidRange, pending, awaiting, newStudents] = await Promise.all([
    prisma.order.aggregate({ _sum: { total_idr: true }, where: { status: "paid" } }),
    prisma.order.aggregate({
      _sum: { total_idr: true },
      where: { status: "paid", ...(verifiedInRange ? { verified_at: verifiedInRange } : {}) },
    }),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.count({
      where: { status: "paid", ...(verifiedInRange ? { verified_at: verifiedInRange } : {}) },
    }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.order.count({ where: { status: "awaiting_verification" } }),
    prisma.enrollment.count({
      where: start ? { enrolled_at: { gte: start } } : {},
    }),
  ]);

  const revenue_in_range = revRange._sum.total_idr ?? 0;
  const avg_order_value = paidRange > 0 ? Math.round(revenue_in_range / paidRange) : 0;

  res.json({
    range,
    revenue_total: revAll._sum.total_idr ?? 0,
    revenue_in_range,
    paid_orders_count: paidAll,
    paid_orders_in_range: paidRange,
    avg_order_value,
    pending_count: pending,
    awaiting_count: awaiting,
    new_students_in_range: newStudents,
  });
});

// ============ GET /revenue-series ============

reportsRouter.get("/revenue-series", ...requireAdmin, async (req, res) => {
  const range = parseRange(req.query.range);
  const bucket = parseBucket(req.query.bucket, range);
  const start = rangeStart(range);

  // Agregasi di Postgres dengan date_trunc pada zona Asia/Jakarta agar bucket konsisten.
  // verified_at disimpan UTC; AT TIME ZONE 'Asia/Jakarta' menggeser ke waktu lokal sebelum trunc.
  const truncUnit = bucket === "month" ? "month" : "day";
  const conditions: Prisma.Sql[] = [
    Prisma.sql`status = 'paid'::"OrderStatus"`,
    Prisma.sql`verified_at IS NOT NULL`,
  ];
  if (start) conditions.push(Prisma.sql`verified_at >= ${start}`);
  const whereSql = Prisma.join(conditions, " AND ");

  const rows = await prisma.$queryRaw<{ period: string; revenue: bigint | number; orders: bigint | number }[]>(
    Prisma.sql`
      SELECT
        to_char(
          date_trunc(${truncUnit}, verified_at AT TIME ZONE ${JAKARTA_TZ}),
          ${bucket === "month" ? "YYYY-MM" : "YYYY-MM-DD"}
        ) AS period,
        COALESCE(SUM(total_idr), 0) AS revenue,
        COUNT(*) AS orders
      FROM orders
      WHERE ${whereSql}
      GROUP BY 1
      ORDER BY 1 ASC
    `,
  );

  const byPeriod = new Map<string, { revenue: number; orders: number }>();
  for (const r of rows) {
    byPeriod.set(r.period, { revenue: Number(r.revenue), orders: Number(r.orders) });
  }

  const points = buildBuckets(start, bucket).map((period) => {
    const hit = byPeriod.get(period);
    return { period, revenue: hit?.revenue ?? 0, orders: hit?.orders ?? 0 };
  });

  res.json({ bucket, points });
});

// ============ GET /top-courses ============

reportsRouter.get("/top-courses", ...requireAdmin, async (req, res) => {
  const range = parseRange(req.query.range);
  const start = rangeStart(range);
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 50) : 5;

  const grouped = await prisma.order.groupBy({
    by: ["course_id"],
    where: {
      status: "paid",
      item_type: "course",
      course_id: { not: null },
      ...(start ? { verified_at: { gte: start } } : {}),
    },
    _sum: { total_idr: true },
    _count: { _all: true },
    orderBy: { _sum: { total_idr: "desc" } },
    take: limit,
  });

  const courseIds = grouped.map((g) => g.course_id!).filter(Boolean);
  const courses = await prisma.course.findMany({
    where: { id: { in: courseIds } },
    select: { id: true, title: true, slug: true },
  });
  const courseMap = new Map(courses.map((c) => [c.id, c]));

  const result = grouped.map((g) => {
    const c = courseMap.get(g.course_id!);
    return {
      course_id: g.course_id!,
      title: c?.title ?? "(kelas dihapus)",
      slug: c?.slug ?? "",
      revenue: g._sum.total_idr ?? 0,
      paid_count: g._count._all,
    };
  });

  res.json(result);
});

// ============ GET /conversion ============

const ALL_STATUSES = [
  "pending",
  "awaiting_verification",
  "paid",
  "rejected",
  "expired",
  "cancelled",
  "processing",
  "failed",
] as const;

reportsRouter.get("/conversion", ...requireAdmin, async (req, res) => {
  const range = parseRange(req.query.range);
  const start = rangeStart(range);

  const grouped = await prisma.order.groupBy({
    by: ["status"],
    where: start ? { created_at: { gte: start } } : {},
    _count: { _all: true },
  });

  const by_status = Object.fromEntries(ALL_STATUSES.map((s) => [s, 0])) as Record<
    (typeof ALL_STATUSES)[number],
    number
  >;
  let total = 0;
  let paid = 0;
  for (const g of grouped) {
    const count = g._count._all;
    by_status[g.status] = count;
    total += count;
    if (g.status === "paid") paid = count;
  }

  const conversion_rate = total > 0 ? Math.round((paid / total) * 1000) / 10 : 0;

  res.json({ total_orders: total, by_status, conversion_rate });
});

// ============ GET /recent-orders ============

const courseSelect = { id: true, slug: true, title: true, cover_image_url: true, level: true, category: true, instructor_name: true };
const ebookSelect = { id: true, slug: true, title: true, cover_image_url: true, category: true, author: true };
const eventSelect = { id: true, slug: true, title: true, cover_image_url: true, category: true, date_label: true, location: true };

reportsRouter.get("/recent-orders", ...requireAdmin, async (req, res) => {
  const limitRaw = Number(req.query.limit);
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 50) : 10;

  const orders = await prisma.order.findMany({
    where: { status: "paid" },
    include: {
      course: { select: courseSelect },
      ebook: { select: ebookSelect },
      event: { select: eventSelect },
      user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
    },
    orderBy: [{ verified_at: "desc" }, { created_at: "desc" }],
    take: limit,
  });

  res.json(orders);
});

// ============ GET /user/:userId — detail siswa ============

reportsRouter.get("/user/:userId", ...requireAdmin, async (req, res) => {
  const userId = req.params.userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      created_at: true,
      profile: { select: { full_name: true, avatar_url: true } },
      roles: { select: { role: true } },
    },
  });
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  const [enrollments, orders, paidAgg] = await Promise.all([
    prisma.enrollment.findMany({
      where: { user_id: userId },
      orderBy: { enrolled_at: "desc" },
      select: {
        id: true,
        enrolled_at: true,
        completed_at: true,
        course: {
          select: {
            id: true,
            slug: true,
            title: true,
            cover_image_url: true,
            level: true,
            category: true,
            instructor_name: true,
            duration_minutes: true,
          },
        },
      },
    }),
    prisma.order.findMany({
      where: { user_id: userId },
      orderBy: { created_at: "desc" },
      include: {
        course: { select: courseSelect },
        ebook: { select: ebookSelect },
        event: { select: eventSelect },
      },
    }),
    prisma.order.aggregate({
      _sum: { total_idr: true },
      _count: { _all: true },
      where: { user_id: userId, status: "paid" },
    }),
  ]);

  // Hitung progress per enrollment: lesson selesai vs total lesson di kelas.
  const courseIds = enrollments.map((e) => e.course.id);

  // Total lesson per kelas (lewat modules → lessons).
  const lessonsByCourse = new Map<string, string[]>();
  if (courseIds.length > 0) {
    const lessons = await prisma.lesson.findMany({
      where: { module: { course_id: { in: courseIds } } },
      select: { id: true, module: { select: { course_id: true } } },
    });
    for (const l of lessons) {
      const cid = l.module.course_id;
      const arr = lessonsByCourse.get(cid) ?? [];
      arr.push(l.id);
      lessonsByCourse.set(cid, arr);
    }
  }

  // Lesson yang sudah diselesaikan user.
  const completed = await prisma.lessonProgress.findMany({
    where: { user_id: userId, completed: true },
    select: { lesson_id: true },
  });
  const completedSet = new Set(completed.map((c) => c.lesson_id));

  const enrollmentsOut = enrollments.map((e) => {
    const lessonIds = lessonsByCourse.get(e.course.id) ?? [];
    const total_lessons = lessonIds.length;
    const completed_lessons = lessonIds.filter((id) => completedSet.has(id)).length;
    const percent = total_lessons > 0 ? Math.round((completed_lessons / total_lessons) * 100) : 0;
    return {
      id: e.id,
      enrolled_at: e.enrolled_at,
      completed_at: e.completed_at,
      course: e.course,
      progress: { completed_lessons, total_lessons, percent },
    };
  });

  res.json({
    id: user.id,
    email: user.email,
    created_at: user.created_at,
    full_name: user.profile?.full_name ?? null,
    avatar_url: user.profile?.avatar_url ?? null,
    roles: user.roles.map((r) => r.role),
    stats: {
      enrollments_count: enrollments.length,
      orders_count: orders.length,
      paid_orders_count: paidAgg._count._all,
      total_spent_idr: paidAgg._sum.total_idr ?? 0,
    },
    enrollments: enrollmentsOut,
    orders,
  });
});
