// Integrasi nyata Mayar (https://api.mayar.club/hl/v1 sandbox atau
// https://api.mayar.id/hl/v1 produksi). Autentikasi: Bearer API key biasa
// (bukan HMAC seperti DOKU). Referensi: https://docs.mayar.id/api-reference/invoice/create
//
// Mayar TIDAK menandatangani body webhook seperti DOKU/Stripe — verifikasi
// dilakukan lewat token rahasia yang ditaruh sebagai query param saat
// mendaftarkan URL webhook di dashboard Mayar, mis.
//   https://fazacademy.id/api/payment-gateway/webhook?token=<MAYAR_WEBHOOK_TOKEN>
// verifyMayarWebhook() di bawah membandingkan token itu terhadap env.

import type { Request } from "express";
import type { Order } from "@prisma/client";
import { env, MAYAR_BASE_URL } from "../env.js";
import type { ChargeResult, GatewayChargeStatus, WebhookResult } from "./index.js";

function itemLabel(order: Order): string {
  return order.item_type === "course" ? "Kelas" : order.item_type === "ebook" ? "E-book" : "Event";
}

async function postInvoice(body: Record<string, unknown>): Promise<ChargeResult> {
  const res = await fetch(`${MAYAR_BASE_URL}/invoice/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.MAYAR_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`Mayar mengembalikan respons tidak valid (status ${res.status})`);
  }

  if (!res.ok) {
    const message = parsed?.messages || `Mayar menolak permintaan (status ${res.status})`;
    throw new Error(message);
  }

  const url: string | undefined = parsed?.data?.link;
  const transactionId: string | undefined = parsed?.data?.transactionId;
  if (!url || !transactionId) throw new Error("Mayar tidak mengembalikan link/transactionId pembayaran");

  return { redirect_url: url, gateway_ref: transactionId };
}

export async function createMayarPayment(
  order: Order,
  customer: { name: string; email: string; phone: string },
): Promise<ChargeResult> {
  return postInvoice({
    name: customer.name,
    email: customer.email,
    mobile: customer.phone,
    redirectUrl: `${env.CLIENT_ORIGIN}/checkout/${order.id}?status=success`,
    description: `${itemLabel(order)} FAZ Academy`,
    expiredAt: order.expires_at.toISOString(),
    items: [{ quantity: 1, rate: order.total_idr, description: `${itemLabel(order)} FAZ Academy` }],
  });
}

// Satu invoice Mayar untuk beberapa Order sekaligus (checkout keranjang) —
// tiap Order jadi satu baris item, dibayar dalam satu transaksi gabungan.
// gateway_ref (transactionId) hasilnya disimpan ke SEMUA order dalam grup,
// jadi webhook yang sama otomatis melunaskan semuanya bersamaan.
export async function createMayarGroupPayment(
  orders: Order[],
  customer: { name: string; email: string; phone: string },
): Promise<ChargeResult> {
  if (orders.length === 0) throw new Error("Tidak ada order untuk dibayar");
  const order_group_id = orders[0].order_group_id;
  const earliestExpiry = orders.reduce((min, o) => (o.expires_at < min ? o.expires_at : min), orders[0].expires_at);

  return postInvoice({
    name: customer.name,
    email: customer.email,
    mobile: customer.phone,
    redirectUrl: `${env.CLIENT_ORIGIN}/checkout-group/${order_group_id}?status=success`,
    description: `Pesanan FAZ Academy (${orders.length} item)`,
    expiredAt: earliestExpiry.toISOString(),
    items: orders.map((o) => ({ quantity: 1, rate: o.total_idr, description: `${itemLabel(o)} FAZ Academy` })),
  });
}

// Payload webhook Mayar (event "payment.received"):
//   { event: "payment.received", data: { transactionId, status: "SUCCESS", ... } }
export async function verifyMayarWebhook(req: Request): Promise<WebhookResult> {
  const token = String(req.query.token ?? "");
  if (!token || token !== env.MAYAR_WEBHOOK_TOKEN) {
    throw new Error("Token webhook Mayar tidak valid");
  }

  // Rute webhook dipasang di belakang express.raw() (lihat index.ts, dibutuhkan
  // untuk verifikasi signature DOKU) — req.body di sini adalah Buffer mentah,
  // bukan objek JSON yang sudah di-parse.
  const rawBody = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : JSON.stringify(req.body);
  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new Error("Body webhook Mayar bukan JSON valid");
  }
  const transactionId: string | undefined = payload?.data?.transactionId;
  if (!transactionId) throw new Error("Webhook Mayar tidak menyertakan transactionId");

  const rawStatus: string = String(payload?.data?.status ?? "").toUpperCase();
  let status: GatewayChargeStatus = "pending";
  if (rawStatus === "SUCCESS" || rawStatus === "PAID" || rawStatus === "SETTLED") status = "paid";
  else if (rawStatus === "FAILED" || rawStatus === "EXPIRED" || rawStatus === "CANCELLED") status = "failed";

  return { gateway_ref: transactionId, status, raw_status: rawStatus || undefined };
}
