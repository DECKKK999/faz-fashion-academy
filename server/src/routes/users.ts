import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin, requireManage } from "../auth.js";

export const usersRouter = Router();

// GET /api/users — list profiles with their roles (managers)
usersRouter.get("/", ...requireManage, async (_req, res) => {
  const profiles = await prisma.profile.findMany({
    select: {
      id: true,
      user_id: true,
      full_name: true,
      user: { select: { email: true, roles: { select: { role: true } } } },
    },
    orderBy: { created_at: "asc" },
  });
  res.json(
    profiles.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.user.email,
      roles: p.user.roles.map((r) => r.role),
    }))
  );
});

const roleSchema = z.object({ role: z.enum(["admin", "instructor", "student"]) });

// POST /api/users/:userId/roles — add a role (admin only)
usersRouter.post("/:userId/roles", ...requireAdmin, async (req, res) => {
  const parsed = roleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  const user = await prisma.user.findUnique({ where: { id: req.params.userId } });
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  await prisma.userRole.upsert({
    where: { user_id_role: { user_id: req.params.userId, role: parsed.data.role } },
    create: { user_id: req.params.userId, role: parsed.data.role },
    update: {},
  });
  res.status(201).json({ ok: true });
});

// DELETE /api/users/:userId/roles/:role — remove a role (admin only)
usersRouter.delete("/:userId/roles/:role", ...requireAdmin, async (req, res) => {
  const parsed = roleSchema.safeParse({ role: req.params.role });
  if (!parsed.success) return res.status(400).json({ error: "Role tidak valid" });
  await prisma.userRole.deleteMany({
    where: { user_id: req.params.userId, role: parsed.data.role },
  });
  res.json({ ok: true });
});
