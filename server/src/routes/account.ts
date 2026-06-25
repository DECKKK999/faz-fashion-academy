import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, hashPassword, verifyPassword } from "../auth.js";
import { uploadAvatar } from "../upload.js";

export const accountRouter = Router();

// Bangun objek sesi (bentuk sama persis dengan /auth/me)
async function buildSession(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      email_verified: true,
      profile: { select: { id: true, user_id: true, full_name: true, avatar_url: true } },
      roles: { select: { role: true } },
    },
  });
  return {
    user: { id: user.id, email: user.email, email_verified: user.email_verified },
    profile: user.profile,
    roles: user.roles.map((r) => r.role),
  };
}

// PATCH /api/account/profile { full_name } — perbarui nama lengkap
accountRouter.patch("/profile", requireAuth, async (req, res) => {
  const parsed = z
    .object({ full_name: z.string().trim().min(1, "Nama wajib diisi").max(120, "Nama terlalu panjang") })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Data tidak valid" });

  const userId = req.user!.id;
  await prisma.profile.upsert({
    where: { user_id: userId },
    create: { user_id: userId, full_name: parsed.data.full_name },
    update: { full_name: parsed.data.full_name },
  });

  return res.json(await buildSession(userId));
});

// POST /api/account/avatar — unggah avatar (field 'avatar')
accountRouter.post("/avatar", requireAuth, uploadAvatar.single("avatar"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Gambar avatar wajib diunggah" });

  const userId = req.user!.id;
  const avatar_url = `/api/uploads/${req.file.filename}`;
  await prisma.profile.upsert({
    where: { user_id: userId },
    create: { user_id: userId, full_name: "", avatar_url },
    update: { avatar_url },
  });

  return res.json(await buildSession(userId));
});

// POST /api/account/change-password { current_password, new_password }
accountRouter.post("/change-password", requireAuth, async (req, res) => {
  const parsed = z
    .object({
      current_password: z.string().min(1, "Kata sandi saat ini wajib diisi"),
      new_password: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
    })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Data tidak valid" });

  const userId = req.user!.id;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "Pengguna tidak ditemukan" });

  const ok = await verifyPassword(parsed.data.current_password, user.password_hash);
  if (!ok) return res.status(400).json({ error: "Kata sandi saat ini salah" });

  const password_hash = await hashPassword(parsed.data.new_password);
  await prisma.user.update({ where: { id: userId }, data: { password_hash } });

  return res.json({ ok: true });
});
