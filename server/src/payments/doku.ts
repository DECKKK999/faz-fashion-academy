// Integrasi nyata DOKU Checkout (https://api-sandbox.doku.com atau
// https://api.doku.com, tergantung DOKU_MODE). Skema autentikasi: HMAC-SHA256
// simetris — setiap request ditandatangani pakai Secret Key, terverifikasi
// lewat kombinasi header Client-Id/Request-Id/Request-Timestamp/Digest/Signature.
// Kontrak request/response di bawah sudah divalidasi langsung ke API DOKU
// (lihat server/scripts/doku-smoke-test.ts).

import { createHash, createHmac, randomUUID } from "node:crypto";
import type { Order } from "@prisma/client";
import { env, DOKU_BASE_URL } from "../env.js";
import type { ChargeResult, GatewayChargeStatus, WebhookResult } from "./index.js";

const CHECKOUT_PATH = "/checkout/v1/payment";

function digest(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("base64");
}

function timestamp(): string {
  return new Date().toISOString().replace(/\.\d+Z$/, "Z");
}

function signature(requestId: string, requestTimestamp: string, requestTarget: string, digestValue: string): string {
  const raw = [
    `Client-Id:${env.DOKU_CLIENT_ID}`,
    `Request-Id:${requestId}`,
    `Request-Timestamp:${requestTimestamp}`,
    `Request-Target:${requestTarget}`,
    `Digest:${digestValue}`,
  ].join("\n");
  const hmac = createHmac("sha256", env.DOKU_SECRET_KEY).update(raw, "utf8").digest("base64");
  return `HMACSHA256=${hmac}`;
}

export async function createDokuPayment(
  order: Order,
  customer: { name: string; email: string },
): Promise<ChargeResult> {
  const invoiceNumber = order.id;
  const itemLabel = order.item_type === "course" ? "Kelas" : order.item_type === "ebook" ? "E-book" : "Event";
  const body = {
    order: {
      amount: order.total_idr,
      invoice_number: invoiceNumber,
      currency: "IDR",
      callback_url: `${env.CLIENT_ORIGIN}/checkout/${order.id}?status=success`,
      callback_url_cancel: `${env.CLIENT_ORIGIN}/checkout/${order.id}?status=cancel`,
      line_items: [{ name: `${itemLabel} FAZ Academy`, price: order.total_idr, quantity: 1 }],
    },
    payment: { payment_due_date: 60 },
    customer: { name: customer.name, email: customer.email },
  };
  const bodyStr = JSON.stringify(body);

  const requestId = randomUUID();
  const requestTimestamp = timestamp();
  const digestValue = digest(bodyStr);
  const sig = signature(requestId, requestTimestamp, CHECKOUT_PATH, digestValue);

  const res = await fetch(`${DOKU_BASE_URL}${CHECKOUT_PATH}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Client-Id": env.DOKU_CLIENT_ID,
      "Request-Id": requestId,
      "Request-Timestamp": requestTimestamp,
      Signature: sig,
      Digest: digestValue,
    },
    body: bodyStr,
  });

  const text = await res.text();
  let parsed: any;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(`DOKU mengembalikan respons tidak valid (status ${res.status})`);
  }

  if (!res.ok) {
    const message = parsed?.error?.message ?? `DOKU menolak permintaan (status ${res.status})`;
    throw new Error(message);
  }

  const url = parsed?.response?.payment?.url;
  if (!url) throw new Error("DOKU tidak mengembalikan URL pembayaran");

  return { redirect_url: url, gateway_ref: invoiceNumber };
}

// Skema notifikasi webhook DOKU pakai header sama (Client-Id/Request-Id/
// Request-Timestamp/Digest/Signature) — Digest & Signature dihitung ulang
// dari raw body yang diterima lalu dibandingkan ke header yang dikirim DOKU.
export async function verifyDokuWebhook(rawBody: string, headers: Record<string, string | string[] | undefined>): Promise<WebhookResult> {
  const requestId = String(headers["request-id"] ?? "");
  const requestTimestamp = String(headers["request-timestamp"] ?? "");
  const receivedSignature = String(headers["signature"] ?? "");

  if (!requestId || !requestTimestamp || !receivedSignature) {
    throw new Error("Header webhook DOKU tidak lengkap");
  }

  const digestValue = digest(rawBody);
  const expectedSignature = signature(requestId, requestTimestamp, "/api/payment-gateway/webhook", digestValue);
  if (expectedSignature !== receivedSignature) {
    throw new Error("Signature webhook DOKU tidak valid");
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    throw new Error("Body webhook DOKU bukan JSON valid");
  }

  const invoiceNumber: string | undefined = payload?.order?.invoice_number ?? payload?.transaction?.original_request_id;
  if (!invoiceNumber) throw new Error("Webhook DOKU tidak menyertakan invoice_number");

  const rawStatus: string = String(payload?.transaction?.status ?? payload?.order?.status ?? "").toUpperCase();
  let status: GatewayChargeStatus = "pending";
  if (rawStatus === "SUCCESS" || rawStatus === "PAID" || rawStatus === "SETTLEMENT") status = "paid";
  else if (rawStatus === "FAILED" || rawStatus === "EXPIRED" || rawStatus === "VOID" || rawStatus === "REFUNDED") status = "failed";

  return { gateway_ref: invoiceNumber, status, raw_status: rawStatus || undefined };
}
