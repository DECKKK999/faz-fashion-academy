import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../auth.js";
import { sendMail, templates, activeTransport } from "../mailer/index.js";
import { env, smtpConfigured } from "../env.js";

export const adminEmailRouter = Router();

// GET /api/admin/email/config — info transport mailer (tanpa membocorkan kredensial SMTP)
adminEmailRouter.get("/config", ...requireAdmin, async (_req, res) => {
  res.json({
    transport: activeTransport(),
    smtpConfigured,
    from: env.MAIL_FROM,
  });
});

// POST /api/admin/email/test — kirim email tes ke alamat tujuan (default: email admin)
adminEmailRouter.post("/test", ...requireAdmin, async (req, res) => {
  const parsed = z
    .object({ to: z.string().trim().email("Alamat email tidak valid").optional() })
    .safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const to = parsed.data.to || req.user!.email;
  const result = await sendMail({
    to,
    user_id: req.user!.id,
    ...templates.test(),
  });
  res.json({ ok: result.ok, transport: result.transport, logId: result.logId });
});

// GET /api/admin/email/logs — riwayat EmailLog terbaru, dengan filter status/template
adminEmailRouter.get("/logs", ...requireAdmin, async (req, res) => {
  const query = z
    .object({
      take: z.coerce.number().int().min(1).max(200).default(50),
      status: z.string().trim().min(1).optional(),
      template: z.string().trim().min(1).optional(),
    })
    .safeParse(req.query);
  if (!query.success) return res.status(400).json({ error: query.error.errors[0]?.message });

  const { take, status, template } = query.data;
  const where: { status?: string; template?: string } = {};
  if (status && status !== "all") where.status = status;
  if (template && template !== "all") where.template = template;

  const logs = await prisma.emailLog.findMany({
    where,
    orderBy: { created_at: "desc" },
    take,
  });
  res.json(logs);
});
