import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { prisma } from "../db.js";
import { env, smtpConfigured } from "../env.js";

const MAILDIR = path.resolve(process.cwd(), "maildir");
if (!existsSync(MAILDIR)) mkdirSync(MAILDIR, { recursive: true });

export type SendMailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  template: string;
  user_id?: string | null;
  order_id?: string | null;
};

let cachedTransport: any = null;
async function getSmtpTransport() {
  if (cachedTransport) return cachedTransport;
  // lazy import so the app boots without nodemailer when only dev transport is used
  const nodemailer = (await import("nodemailer")).default;
  cachedTransport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  });
  return cachedTransport;
}

export const activeTransport = (): "dev" | "smtp" =>
  env.MAIL_TRANSPORT === "smtp" && smtpConfigured ? "smtp" : "dev";

/**
 * Sends an email via the active transport and records an EmailLog row.
 * Never throws on transport failure — returns {ok:false} and logs the error.
 */
export async function sendMail(input: SendMailInput): Promise<{ ok: boolean; logId: string; transport: "dev" | "smtp" }> {
  const transport = activeTransport();
  let status = "sent";
  let error: string | null = null;

  try {
    if (transport === "smtp") {
      const t = await getSmtpTransport();
      await t.sendMail({ from: env.MAIL_FROM, to: input.to, subject: input.subject, text: input.text, html: input.html });
    } else {
      // dev transport: tulis ke maildir + console
      const stamp = new Date().toISOString().replace(/[:.]/g, "-");
      const file = path.join(MAILDIR, `${stamp}-${input.template}.txt`);
      writeFileSync(
        file,
        `To: ${input.to}\nFrom: ${env.MAIL_FROM}\nSubject: ${input.subject}\nTemplate: ${input.template}\n\n${input.text}\n`
      );
      console.log(`[mailer:dev] -> ${input.to} | ${input.subject} | tersimpan di ${file}`);
    }
  } catch (e) {
    status = "failed";
    error = e instanceof Error ? e.message : String(e);
    console.error("[mailer] gagal mengirim:", error);
  }

  const logRow = await prisma.emailLog.create({
    data: {
      to_email: input.to,
      subject: input.subject,
      template: input.template,
      status,
      error,
      transport,
      user_id: input.user_id ?? null,
      order_id: input.order_id ?? null,
    },
  });

  return { ok: status === "sent", logId: logRow.id, transport };
}

// Helper: jalankan pengiriman tanpa memblok / tanpa melempar (fire-and-forget aman).
export function sendMailSafe(input: SendMailInput) {
  sendMail(input).catch((e) => console.error("[mailer] unexpected:", e));
}

// ---------- Template ----------
const wrap = (title: string, bodyHtml: string) => `<!doctype html><html><body style="font-family:Arial,sans-serif;color:#1a1a1a;line-height:1.6">
<div style="max-width:560px;margin:0 auto;padding:24px">
<h2 style="font-weight:600">${title}</h2>
${bodyHtml}
<hr style="border:none;border-top:1px solid #eee;margin:24px 0"/>
<p style="font-size:12px;color:#888">FAZ Academy — Fashion A-Z Academy Indonesia</p>
</div></body></html>`;

export const templates = {
  welcome: (name: string) => ({
    template: "welcome",
    subject: "Selamat datang di FAZ Academy",
    text: `Halo ${name},\n\nAkun kamu berhasil dibuat. Selamat belajar di FAZ Academy!\n\n${env.APP_BASE_URL}/kelas`,
    html: wrap("Selamat datang di FAZ Academy 👋", `<p>Halo ${name},</p><p>Akun kamu berhasil dibuat. Mulai jelajahi kelas kami.</p><p><a href="${env.APP_BASE_URL}/kelas">Lihat Katalog Kelas</a></p>`),
  }),
  orderCreated: (opts: { name: string; itemTitle: string; totalIdr: number; uniqueCode: number; orderId: string }) => ({
    template: "order_created",
    subject: `Instruksi pembayaran — ${opts.itemTitle}`,
    text: `Halo ${opts.name},\n\nPesanan untuk "${opts.itemTitle}" sudah dibuat.\nTotal transfer: Rp ${opts.totalIdr.toLocaleString("id-ID")} (kode unik ${opts.uniqueCode} — transfer tepat sampai 3 digit terakhir).\n\nLanjutkan & unggah bukti di: ${env.APP_BASE_URL}/checkout/${opts.orderId}`,
    html: wrap("Selesaikan Pembayaran", `<p>Halo ${opts.name},</p><p>Pesanan untuk <b>${opts.itemTitle}</b> sudah dibuat.</p><p>Total transfer: <b>Rp ${opts.totalIdr.toLocaleString("id-ID")}</b><br/><small>Kode unik ${opts.uniqueCode} — transfer tepat sampai 3 digit terakhir.</small></p><p><a href="${env.APP_BASE_URL}/checkout/${opts.orderId}">Lanjutkan & Unggah Bukti</a></p>`),
  }),
  paymentVerified: (opts: { name: string; itemTitle: string }) => ({
    template: "payment_verified",
    subject: `Pembayaran terverifikasi — ${opts.itemTitle}`,
    text: `Halo ${opts.name},\n\nPembayaran untuk "${opts.itemTitle}" sudah kami verifikasi. Akses sudah aktif.\n\n${env.APP_BASE_URL}/dashboard`,
    html: wrap("Pembayaran Terverifikasi ✅", `<p>Halo ${opts.name},</p><p>Pembayaran untuk <b>${opts.itemTitle}</b> sudah diverifikasi. Akses kamu sudah aktif.</p><p><a href="${env.APP_BASE_URL}/dashboard">Buka Dashboard</a></p>`),
  }),
  paymentRejected: (opts: { name: string; itemTitle: string; reason: string; orderId: string }) => ({
    template: "payment_rejected",
    subject: `Pembayaran ditolak — ${opts.itemTitle}`,
    text: `Halo ${opts.name},\n\nMohon maaf, bukti pembayaran untuk "${opts.itemTitle}" ditolak.\nAlasan: ${opts.reason}\n\nKirim ulang bukti di: ${env.APP_BASE_URL}/checkout/${opts.orderId}`,
    html: wrap("Pembayaran Ditolak", `<p>Halo ${opts.name},</p><p>Mohon maaf, bukti pembayaran untuk <b>${opts.itemTitle}</b> ditolak.</p><p>Alasan: ${opts.reason}</p><p><a href="${env.APP_BASE_URL}/checkout/${opts.orderId}">Kirim Ulang Bukti</a></p>`),
  }),
  passwordReset: (opts: { name: string; link: string }) => ({
    template: "password_reset",
    subject: "Reset kata sandi FAZ Academy",
    text: `Halo ${opts.name},\n\nKami menerima permintaan reset kata sandi. Buka tautan berikut (berlaku 1 jam):\n${opts.link}\n\nAbaikan email ini jika kamu tidak meminta.`,
    html: wrap("Reset Kata Sandi", `<p>Halo ${opts.name},</p><p>Kami menerima permintaan reset kata sandi. Tautan berlaku 1 jam.</p><p><a href="${opts.link}">Reset Kata Sandi</a></p><p style="font-size:12px;color:#888">Abaikan jika kamu tidak meminta.</p>`),
  }),
  emailVerification: (opts: { name: string; link: string }) => ({
    template: "email_verification",
    subject: "Verifikasi email FAZ Academy",
    text: `Halo ${opts.name},\n\nVerifikasi email kamu dengan membuka tautan berikut (berlaku 24 jam):\n${opts.link}`,
    html: wrap("Verifikasi Email", `<p>Halo ${opts.name},</p><p>Verifikasi email kamu untuk mengamankan akun. Tautan berlaku 24 jam.</p><p><a href="${opts.link}">Verifikasi Email</a></p>`),
  }),
  test: () => ({
    template: "test",
    subject: "Tes email FAZ Academy",
    text: "Ini email tes dari FAZ Academy. Konfigurasi mailer berfungsi.",
    html: wrap("Tes Email", "<p>Ini email tes dari FAZ Academy. Konfigurasi mailer berfungsi.</p>"),
  }),
};
