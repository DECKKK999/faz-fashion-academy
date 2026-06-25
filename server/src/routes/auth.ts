import { Router } from "express";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import {
  clearAuthCookie,
  hashPassword,
  requireAuth,
  setAuthCookie,
  signToken,
  verifyPassword,
} from "../auth.js";
import { env } from "../env.js";
import { sendMailSafe, templates } from "../mailer/index.js";

export const authRouter = Router();

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

async function createAndSendVerification(userId: string, email: string, name: string) {
  const raw = randomBytes(32).toString("hex");
  await prisma.user.update({
    where: { id: userId },
    data: { email_verification_token: sha256(raw), email_verification_expires: new Date(Date.now() + 24 * 60 * 60 * 1000) },
  });
  const link = `${env.APP_BASE_URL}/verifikasi-email?token=${raw}`;
  sendMailSafe({ to: email, user_id: userId, ...templates.emailVerification({ name, link }) });
}

const registerSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Kata sandi minimal 8 karakter"),
  full_name: z.string().trim().min(1, "Nama wajib diisi").optional(),
});

const loginSchema = z.object({
  email: z.string().email("Email tidak valid"),
  password: z.string().min(1, "Kata sandi wajib diisi"),
});

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

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Data tidak valid" });
  }
  const { email, password, full_name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (existing) return res.status(409).json({ error: "Email sudah terdaftar" });

  const password_hash = await hashPassword(password);
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password_hash,
      profile: { create: { full_name: full_name ?? "" } },
      roles: { create: { role: "student" } },
    },
  });

  const token = signToken(user.id);
  setAuthCookie(res, token);

  const name = full_name || email.split("@")[0];
  sendMailSafe({ to: user.email, user_id: user.id, ...templates.welcome(name) });
  await createAndSendVerification(user.id, user.email, name);

  return res.status(201).json(await buildSession(user.id));
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Data tidak valid" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return res.status(401).json({ error: "Email atau kata sandi salah" });

  const ok = await verifyPassword(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: "Email atau kata sandi salah" });

  const token = signToken(user.id);
  setAuthCookie(res, token);
  return res.json(await buildSession(user.id));
});

authRouter.post("/logout", (_req, res) => {
  clearAuthCookie(res);
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req, res) => {
  return res.json(await buildSession(req.user!.id));
});

// ===== Lupa / reset kata sandi & verifikasi email =====

// POST /api/auth/forgot-password { email } — selalu balas ok (anti email enumeration)
authRouter.post("/forgot-password", async (req, res) => {
  const parsed = z.object({ email: z.string().email() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Email tidak valid" });
  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email }, include: { profile: true } });
  if (user) {
    const raw = randomBytes(32).toString("hex");
    await prisma.passwordResetToken.create({
      data: { user_id: user.id, token_hash: sha256(raw), expires_at: new Date(Date.now() + 60 * 60 * 1000) },
    });
    const link = `${env.APP_BASE_URL}/reset-password?token=${raw}`;
    const name = user.profile?.full_name || email.split("@")[0];
    sendMailSafe({ to: email, user_id: user.id, ...templates.passwordReset({ name, link }) });
  }
  return res.json({ ok: true });
});

// POST /api/auth/reset-password { token, password }
authRouter.post("/reset-password", async (req, res) => {
  const parsed = z.object({ token: z.string().min(1), password: z.string().min(8, "Kata sandi minimal 8 karakter") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message ?? "Data tidak valid" });
  const row = await prisma.passwordResetToken.findUnique({ where: { token_hash: sha256(parsed.data.token) } });
  if (!row || row.used_at || row.expires_at < new Date()) {
    return res.status(400).json({ error: "Tautan reset tidak valid atau sudah kedaluwarsa" });
  }
  const password_hash = await hashPassword(parsed.data.password);
  await prisma.$transaction([
    prisma.user.update({ where: { id: row.user_id }, data: { password_hash } }),
    prisma.passwordResetToken.update({ where: { id: row.id }, data: { used_at: new Date() } }),
    prisma.passwordResetToken.deleteMany({ where: { user_id: row.user_id, used_at: null } }),
  ]);
  return res.json({ ok: true });
});

// POST /api/auth/verify-email { token }
authRouter.post("/verify-email", async (req, res) => {
  const parsed = z.object({ token: z.string().min(1) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Token tidak valid" });
  const user = await prisma.user.findFirst({ where: { email_verification_token: sha256(parsed.data.token) } });
  if (!user || !user.email_verification_expires || user.email_verification_expires < new Date()) {
    return res.status(400).json({ error: "Tautan verifikasi tidak valid atau sudah kedaluwarsa" });
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { email_verified: true, email_verified_at: new Date(), email_verification_token: null, email_verification_expires: null },
  });
  return res.json({ ok: true });
});

// POST /api/auth/resend-verification (login)
authRouter.post("/resend-verification", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { profile: true } });
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });
  if (user.email_verified) return res.json({ ok: true, already: true });
  await createAndSendVerification(user.id, user.email, user.profile?.full_name || user.email.split("@")[0]);
  return res.json({ ok: true });
});
