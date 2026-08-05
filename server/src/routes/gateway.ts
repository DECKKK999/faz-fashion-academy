// Rute payment-gateway. Lihat ../payments/index.ts untuk catatan gateway aktif.
//
// gatewayRouter        → dimount di /api/payment-gateway
//   POST /orders/:id/charge          (requireAuth, pemilik order — satu item)
//   POST /orders/group/:groupId/charge (requireAuth — checkout keranjang, satu invoice gabungan)
//   POST /webhook                    (PUBLIC — callback dari gateway, raw body — lihat index.ts)
//
// adminGatewayRouter   → dimount di /api/admin/payment-gateway
//   GET  /config              (requireAdmin) — status konfigurasi (boolean saja)

import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import type { Prisma, Order, Event } from "@prisma/client";
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

async function loadProfile(userId: string) {
  return prisma.profile.findUnique({ where: { user_id: userId }, select: { full_name: true, phone: true } });
}

function displayNameFrom(profile: { full_name: string | null } | null, email: string) {
  return profile?.full_name || email.split("@")[0];
}

const adminOrderInclude = {
  course: { select: { title: true } },
  ebook: { select: { title: true } },
  event: { select: { title: true } },
  user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
};

// ============ PUBLIC: status gateway (dipakai frontend checkout) ============

// GET /api/payment-gateway/status
gatewayRouter.get("/status", (_req, res) => {
  const gateway = getGateway();
  res.json({ enabled: !!gateway, gateway: gateway?.name ?? null });
});

// ============ BUYER: buat charge di gateway ============

const chargeBodySchema = z.object({ phone: z.string().trim().min(1).optional() });

// POST /api/payment-gateway/orders/:id/charge
gatewayRouter.post("/orders/:id/charge", requireAuth, async (req, res) => {
  const gateway = getGateway();
  if (!gateway) {
    return res.status(503).json({ error: "Pembayaran sedang tidak tersedia. Silakan coba lagi nanti." });
  }

  const parsed = chargeBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "Data tidak valid" });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.user_id !== req.user!.id) return res.status(404).json({ error: "Order tidak ditemukan" });

  if (order.status === "paid") return res.status(409).json({ error: "Order sudah lunas" });
  if (!["pending", "rejected", "failed", "processing"].includes(order.status)) {
    return res.status(400).json({ error: "Order tidak dapat dibayar pada status ini" });
  }
  if (order.expires_at < new Date() && order.status === "pending") {
    return res.status(400).json({ error: "Batas waktu pembayaran sudah lewat" });
  }

  const profile = await loadProfile(order.user_id);
  const name = displayNameFrom(profile, req.user!.email);
  const phone = parsed.data.phone || profile?.phone || undefined;

  let charge;
  try {
    charge = await gateway.createCharge(order, { name, email: req.user!.email, phone });
  } catch (e: any) {
    return res.status(503).json({ error: e?.message || "Gateway pembayaran tidak tersedia" });
  }

  // Nomor HP baru yang diketik pembeli disimpan ke profil supaya tidak
  // ditanya lagi di order-order berikutnya.
  if (parsed.data.phone && parsed.data.phone !== profile?.phone) {
    await prisma.profile.upsert({
      where: { user_id: order.user_id },
      create: { user_id: order.user_id, full_name: "", phone: parsed.data.phone },
      update: { phone: parsed.data.phone },
    });
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

const PAYABLE_STATUSES = ["pending", "rejected", "failed", "processing"];

// POST /api/payment-gateway/orders/group/:groupId/charge — satu invoice gabungan
// untuk seluruh order dalam grup (checkout keranjang). Hanya didukung gateway
// yang punya createGroupCharge (saat ini: Mayar).
gatewayRouter.post("/orders/group/:groupId/charge", requireAuth, async (req, res) => {
  const gateway = getGateway();
  if (!gateway || !gateway.createGroupCharge) {
    return res.status(503).json({ error: "Pembayaran via gateway belum tersedia untuk checkout keranjang." });
  }

  const parsed = chargeBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ error: "Data tidak valid" });

  const orders = await prisma.order.findMany({
    where: { order_group_id: req.params.groupId, user_id: req.user!.id },
  });
  if (orders.length === 0) return res.status(404).json({ error: "Pesanan tidak ditemukan" });

  const payable = orders.filter((o) => PAYABLE_STATUSES.includes(o.status));
  if (payable.length === 0) {
    if (orders.every((o) => o.status === "paid")) return res.status(409).json({ error: "Semua pesanan sudah lunas" });
    return res.status(400).json({ error: "Pesanan tidak dapat dibayar pada status ini" });
  }
  if (payable.some((o) => o.status === "pending" && o.expires_at < new Date())) {
    return res.status(400).json({ error: "Batas waktu pembayaran sudah lewat" });
  }

  const profile = await loadProfile(req.user!.id);
  const name = displayNameFrom(profile, req.user!.email);
  const phone = parsed.data.phone || profile?.phone || undefined;

  let charge;
  try {
    charge = await gateway.createGroupCharge(payable, { name, email: req.user!.email, phone });
  } catch (e: any) {
    return res.status(503).json({ error: e?.message || "Gateway pembayaran tidak tersedia" });
  }

  if (parsed.data.phone && parsed.data.phone !== profile?.phone) {
    await prisma.profile.upsert({
      where: { user_id: req.user!.id },
      create: { user_id: req.user!.id, full_name: "", phone: parsed.data.phone },
      update: { phone: parsed.data.phone },
    });
  }

  await prisma.order.updateMany({
    where: { id: { in: payable.map((o) => o.id) } },
    data: {
      gateway: gateway.name,
      gateway_ref: charge.gateway_ref,
      gateway_payment_url: charge.redirect_url,
      gateway_status: "pending",
      payment_method: "gateway",
      status: "processing",
    },
  });

  return res.json({ redirect_url: charge.redirect_url });
});

// ============ PUBLIC: webhook callback dari gateway ============

// Tandai satu order lunas + buat entitlement sesuai jenis item (mirror approve),
// dipakai baik untuk charge satuan maupun grup (beberapa order berbagi gateway_ref yang sama).
async function settleOrderPaid(tx: Prisma.TransactionClient, order: Order & { event?: Event | null }, rawStatus?: string) {
  const updated = await tx.order.update({
    where: { id: order.id },
    data: {
      status: "paid",
      gateway_status: rawStatus ?? "paid",
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
}

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

  // Charge grup (checkout keranjang) menyimpan gateway_ref yang SAMA di beberapa
  // order sekaligus, jadi satu webhook di sini bisa perlu melunaskan semuanya.
  const orders = await prisma.order.findMany({
    where: { gateway_ref: result.gateway_ref },
    include: { event: true },
  });
  if (orders.length === 0) return res.status(404).json({ error: "Order tidak ditemukan" });

  if (result.status === "failed") {
    await prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) }, status: { not: "paid" } },
      data: { status: "failed", gateway_status: result.raw_status ?? "failed" },
    });
    return res.json({ ok: true });
  }

  if (result.status !== "paid") {
    // pending / status lain → catat saja, jangan buat entitlement.
    await prisma.order.updateMany({
      where: { id: { in: orders.map((o) => o.id) }, status: { not: "paid" } },
      data: { gateway_status: result.raw_status ?? result.status },
    });
    return res.json({ ok: true });
  }

  // status === "paid" → set lunas + buat entitlement per order (mirror approve), idempoten per order.
  const unpaid = orders.filter((o) => o.status !== "paid");
  for (const order of unpaid) {
    await prisma.$transaction((tx) => settleOrderPaid(tx, order, result.raw_status));

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
  }

  return res.json({ ok: true, already: unpaid.length === 0 });
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
  let webhookUrl = `${env.APP_BASE_URL.replace(/\/$/, "")}/api/payment-gateway/webhook`;
  // Mayar tidak menandatangani body webhook — token rahasia ditaruh di query
  // string URL yang didaftarkan di dashboard Mayar, itulah yang diverifikasi.
  if (name === "mayar" && env.MAYAR_WEBHOOK_TOKEN) {
    webhookUrl += `?token=${env.MAYAR_WEBHOOK_TOKEN}`;
  }
  const config: PaymentGatewayConfig = {
    enabled: !!name,
    gateway: name,
    has_server_key: name ? hasServerKey(name) : false,
    has_webhook_secret: name ? hasWebhookSecret(name) : false,
    webhook_url: webhookUrl,
  };
  res.json(config);
});
