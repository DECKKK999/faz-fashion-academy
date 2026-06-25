import rateLimit from "express-rate-limit";
import { env } from "../env.js";

// Pembatas ketat untuk endpoint sensitif (login/register/forgot/reset).
export const authLimiter = rateLimit({
  windowMs: env.AUTH_RATE_LIMIT_WINDOW_MIN * 60 * 1000,
  max: env.AUTH_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak percobaan. Coba lagi nanti." },
});

// Pembatas longgar untuk API umum (opsional).
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Terlalu banyak permintaan." },
});
