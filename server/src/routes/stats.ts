import { Router } from "express";
import { prisma } from "../db.js";
import { requireManage } from "../auth.js";

export const statsRouter = Router();

// GET /api/stats — counts + revenue for the admin overview
statsRouter.get("/", ...requireManage, async (_req, res) => {
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [courses, ebooks, events, enrollments, students, orders_pending, revAll, rev30, paidCount] =
    await Promise.all([
      prisma.course.count(),
      prisma.ebook.count(),
      prisma.event.count(),
      prisma.enrollment.count(),
      prisma.profile.count(),
      prisma.order.count({ where: { status: "awaiting_verification" } }),
      prisma.order.aggregate({ _sum: { total_idr: true }, where: { status: "paid" } }),
      prisma.order.aggregate({ _sum: { total_idr: true }, where: { status: "paid", verified_at: { gte: since30 } } }),
      prisma.order.count({ where: { status: "paid" } }),
    ]);
  res.json({
    courses,
    ebooks,
    events,
    enrollments,
    students,
    orders_pending,
    revenue_total: revAll._sum.total_idr ?? 0,
    revenue_30d: rev30._sum.total_idr ?? 0,
    paid_orders_total: paidCount,
  });
});
