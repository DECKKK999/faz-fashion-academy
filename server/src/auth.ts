import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./db.js";
import { env } from "./env.js";

export const COOKIE_NAME = "faz_token";

export type AppRole = "admin" | "instructor" | "student";

export interface AuthUser {
  id: string;
  email: string;
  roles: AppRole[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function hashPassword(plain: string) {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export function signToken(userId: string) {
  return jwt.sign({ sub: userId }, env.JWT_SECRET, {
    expiresIn: `${env.JWT_EXPIRES_DAYS}d`,
  });
}

export function setAuthCookie(res: Response, token: string) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: env.COOKIE_SECURE,
    maxAge: env.JWT_EXPIRES_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

async function loadUser(userId: string): Promise<AuthUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, roles: { select: { role: true } } },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    roles: user.roles.map((r) => r.role as AppRole),
  };
}

function getTokenFromReq(req: Request): string | null {
  const cookieToken = req.cookies?.[COOKIE_NAME];
  if (cookieToken) return cookieToken;
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return null;
}

/** Attaches req.user if a valid token is present; never blocks. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = getTokenFromReq(req);
    if (token) {
      const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
      const user = await loadUser(payload.sub);
      if (user) req.user = user;
    }
  } catch {
    // ignore invalid token for optional auth
  }
  next();
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = getTokenFromReq(req);
    if (!token) return res.status(401).json({ error: "Tidak terautentikasi" });
    const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string };
    const user = await loadUser(payload.sub);
    if (!user) return res.status(401).json({ error: "Sesi tidak valid" });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Sesi tidak valid" });
  }
}

export function requireRole(...roles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "Tidak terautentikasi" });
    const ok = req.user.roles.some((r) => roles.includes(r));
    if (!ok) return res.status(403).json({ error: "Akses ditolak" });
    next();
  };
}

export const requireManage = [requireAuth, requireRole("admin", "instructor")];
export const requireAdmin = [requireAuth, requireRole("admin")];
