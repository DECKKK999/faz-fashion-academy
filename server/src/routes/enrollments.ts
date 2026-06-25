import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

export const enrollmentsRouter = Router();

// GET /api/enrollments — kelas yang dimiliki user saat ini
enrollmentsRouter.get("/", requireAuth, async (req, res) => {
  const enrollments = await prisma.enrollment.findMany({
    where: { user_id: req.user!.id },
    orderBy: { enrolled_at: "desc" },
    include: {
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
  });
  res.json(enrollments);
});
