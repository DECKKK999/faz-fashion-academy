// Rute payment-gateway (SCAFFOLD). Lihat ../payments/index.ts untuk catatan.
//
// gatewayRouter        → dimount di /api/payment-gateway
//   POST /orders/:id/charge   (requireAuth, pemilik order)
//   POST /webhook             (PUBLIC — callback dari gateway)
//
// adminGatewayRouter   → dimount di /api/admin/payment-gateway
//   GET  /config              (requireAdmin) — status konfigurasi (boolean saja)
//
// CATATAN PRODUKSI: webhook di bawah membaca JSON body (express.json sudah
// terpasang global). Untuk verifikasi signature yang benar, produksi sebaiknya
// memakai RAW body pada path webhook ini (mis. express.raw) lalu memverifikasi
// signature sebelum JSON.parse. Saat ini masih scaffold sehingga JSON cukup.

import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { env } from "../env.js";
import {
  getGateway,
  activeGatewayName,
  hasServerKey,
  hasWebhookSecret,
} from "../payments/index.js";
import { sendMailSafe, templates } from "../mailer/index.js";

export const gatewayRouter = Router();
export const adminGatewayRouter = Router();

function ticketCode() {
  const raw = randomBytes(6).toString("hex").toUpperCase();
  return `FAZ-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

function itemTitle(order: { course?: { title: string } | null; ebook?: { title: string } | null; event?: { title: string } | null }): string {
  return order.course?.title ?? order.ebook?.title ?? order.event?.title ?? "Pesanan";
}

const adminOrderInclude = {
  course: { select: { title: true } },
  ebook: { select: { title: true } },
  event: { select: { title: true } },
  user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
};

// ============ BUYER: buat charge di gateway ============

// POST /api/payment-gateway/orders/:id/charge
gatewayRouter.post("/orders/:id/charge", requireAuth, async (req, res) => {
  const gateway = getGateway();
  if (!gateway) {
    return res.status(503).json({ error: "Pembayaran via gateway belum diaktifkan. Gunakan transfer manual." });
  }

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.user_id !== req.user!.id) return res.status(404).json({ error: "Order tidak ditemukan" });

  if (order.status === "paid") return res.status(409).json({ error: "Order sudah lunas" });
  if (!["pending", "rejected", "failed", "processing"].includes(order.status)) {
    return res.status(400).json({ error: "Order tidak dapat dibayar pada status ini" });
  }
  if (order.expires_at < new Date() && order.status === "pending") {
    return res.status(400).json({ error: "Batas waktu pembayaran sudah lewat" });
  }

  let charge;
  try {
    charge = await gateway.createCharge(order);
  } catch (e: any) {
    return res.status(503).json({ error: e?.message || "Gateway pembayaran tidak tersedia" });
  }

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      gateway: gateway.name,
      gateway_ref: charge.gateway_ref,
      gateway_payment_url: charge.redirect_url,
      gateway_status: "pending",
      payment_method: "gateway",
      status: "processing",
    },
  });

  return res.json({ redirect_url: charge.redirect_url, order_id: updated.id });
});

// ============ PUBLIC: webhook callback dari gateway ============

// POST /api/payment-gateway/webhook
gatewayRouter.post("/webhook", async (req, res) => {
  const gateway = getGateway();
  if (!gateway) return res.status(503).json({ error: "Gateway tidak aktif" });

  let result;
  try {
    result = await gateway.verifyWebhook(req);
  } catch (e: any) {
    return res.status(400).json({ error: e?.message || "Webhook tidak valid" });
  }

  if (!result.gateway_ref) return res.status(400).json({ error: "Referensi gateway tidak ditemukan" });

  const order = await prisma.order.findFirst({
    where: { gateway_ref: result.gateway_ref },
    include: { event: true },
  });
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });

  // Idempotent: jika sudah lunas, balas OK tanpa memproses ulang.
  if (order.status === "paid") return res.json({ ok: true, already: true });

  if (result.status === "failed") {
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "failed", gateway_status: result.raw_status ?? "failed" },
    });
    return res.json({ ok: true });
  }

  if (result.status !== "paid") {
    // pending / status lain → catat saja, jangan buat entitlement.
    await prisma.order.update({
      where: { id: order.id },
      data: { gateway_status: result.raw_status ?? result.status },
    });
    return res.json({ ok: true });
  }

  // status === "paid" → set lunas + buat entitlement (mirror approve), idempotent.
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        status: "paid",
        gateway_status: result.raw_status ?? "paid",
        verified_at: new Date(),
        rejection_reason: null,
      },
    });

    if (order.item_type === "course" && order.course_id) {
      await tx.enrollment.upsert({
        where: { user_id_course_id: { user_id: order.user_id, course_id: order.course_id } },
        create: { user_id: order.user_id, course_id: order.course_id },
        update: {},
      });
    } else if (order.item_type === "ebook" && order.ebook_id) {
      await tx.ebookGrant.upsert({
        where: { user_id_ebook_id: { user_id: order.user_id, ebook_id: order.ebook_id } },
        create: { user_id: order.user_id, ebook_id: order.ebook_id, order_id: order.id },
        update: {},
      });
    } else if (order.item_type === "event" && order.event_id) {
      const existing = await tx.eventTicket.findUnique({
        where: { user_id_event_id: { user_id: order.user_id, event_id: order.event_id } },
      });
      if (!existing) {
        await tx.eventTicket.create({
          data: { user_id: order.user_id, event_id: order.event_id, order_id: order.id, ticket_code: ticketCode() },
        });
        if (order.event?.spots_left != null) {
          await tx.event.update({
            where: { id: order.event_id },
            data: { spots_left: Math.max(0, order.event.spots_left - 1) },
          });
        }
      }
    }
  });

  const full = await prisma.order.findUnique({ where: { id: order.id }, include: adminOrderInclude });
  if (full?.user?.email) {
    sendMailSafe({
      to: full.user.email,
      user_id: full.user_id,
      order_id: full.id,
      ...templates.paymentVerified({
        name: full.user.profile?.full_name || full.user.email.split("@")[0],
        itemTitle: itemTitle(full),
      }),
    });
  }

  return res.json({ ok: true });
});

// ============ ADMIN: status konfigurasi gateway ============

export type PaymentGatewayConfig = {
  enabled: boolean;
  gateway: string | null;
  has_server_key: boolean;
  has_webhook_secret: boolean;
  webhook_url: string;
};

// GET /api/admin/payment-gateway/config
adminGatewayRouter.get("/config", ...requireAdmin, async (_req, res) => {
  const name = activeGatewayName();
  const config: PaymentGatewayConfig = {
    enabled: !!name,
    gateway: name,
    has_server_key: name ? hasServerKey(name) : false,
    has_webhook_secret: name ? hasWebhookSecret(name) : false,
    webhook_url: `${env.APP_BASE_URL.replace(/\/$/, "")}/api/payment-gateway/webhook`,
  };
  res.json(config);
});
