import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  JWT_SECRET: required("JWT_SECRET"),
  PORT: Number(process.env.PORT ?? 4000),
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN ?? "http://localhost:8080",
  JWT_EXPIRES_DAYS: Number(process.env.JWT_EXPIRES_DAYS ?? 7),
  COOKIE_SECURE: (process.env.COOKIE_SECURE ?? "false") === "true",
  NODE_ENV: process.env.NODE_ENV ?? "development",
  // base URL publik untuk link di email (fallback ke origin frontend)
  APP_BASE_URL: process.env.APP_BASE_URL ?? process.env.CLIENT_ORIGIN ?? "http://localhost:8080",

  // ===== Mailer (opsional; default transport "dev" yang menulis ke file/console) =====
  MAIL_TRANSPORT: (process.env.MAIL_TRANSPORT ?? "dev") as "dev" | "smtp",
  MAIL_FROM: process.env.MAIL_FROM ?? "FAZ Academy <no-reply@fazacademy.id>",
  SMTP_HOST: process.env.SMTP_HOST ?? "",
  SMTP_PORT: Number(process.env.SMTP_PORT ?? 587),
  SMTP_SECURE: (process.env.SMTP_SECURE ?? "false") === "true",
  SMTP_USER: process.env.SMTP_USER ?? "",
  SMTP_PASS: process.env.SMTP_PASS ?? "",

  // ===== Rate limit (opsional) =====
  AUTH_RATE_LIMIT_MAX: Number(process.env.AUTH_RATE_LIMIT_MAX ?? 20),
  AUTH_RATE_LIMIT_WINDOW_MIN: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MIN ?? 15),

  // ===== Payment gateway scaffold (opsional; kosong = manual transfer saja) =====
  PAYMENT_GATEWAY: (process.env.PAYMENT_GATEWAY ?? "") as "" | "midtrans" | "xendit",
};

export const smtpConfigured = !!(env.SMTP_HOST && env.SMTP_USER);
