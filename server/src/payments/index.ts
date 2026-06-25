// Payment-gateway SCAFFOLD (Midtrans / Xendit) sebagai alternatif transfer manual.
//
// Modul ini SENGAJA dibuat sebagai kerangka (scaffold) tanpa SDK eksternal apa pun.
// Implementasi nyata (memanggil API Midtrans/Xendit, verifikasi signature, dst.)
// harus dilengkapi sebelum dipakai di produksi.
//
// Diaktifkan lewat env PAYMENT_GATEWAY ("midtrans" | "xendit"). Bila kosong,
// getGateway() mengembalikan null dan aplikasi tetap memakai transfer manual.

import type { Request } from "express";
import type { Order } from "@prisma/client";

export type GatewayName = "midtrans" | "xendit";

/** Status yang dinormalisasi dari callback/webhook gateway. */
export type GatewayChargeStatus = "paid" | "pending" | "failed";

export interface ChargeResult {
  /** URL halaman pembayaran tujuan redirect pembeli. */
  redirect_url: string;
  /** Referensi transaksi di sisi gateway (untuk pencocokan webhook). */
  gateway_ref: string;
}

export interface WebhookResult {
  /** Referensi transaksi gateway yang dipakai mencari Order. */
  gateway_ref: string;
  /** Status pembayaran yang sudah dinormalisasi. */
  status: GatewayChargeStatus;
  /** Status mentah dari payload (untuk audit / penyimpanan). */
  raw_status?: string;
}

export interface PaymentGateway {
  readonly name: GatewayName;
  /** Membuat charge/invoice di gateway untuk sebuah order. */
  createCharge(order: Order): Promise<ChargeResult>;
  /** Memverifikasi & mem-parse payload webhook menjadi hasil ternormalisasi. */
  verifyWebhook(req: Request): Promise<WebhookResult>;
}

function notConfigured(name: GatewayName): never {
  throw new Error(`Payment gateway "${name}" belum dikonfigurasi`);
}

// ===================== Midtrans (STUB) =====================
//
// Kunci dibaca dari env: MIDTRANS_SERVER_KEY, MIDTRANS_CLIENT_KEY,
// MIDTRANS_WEBHOOK_SECRET (opsional). createCharge nyatanya memanggil Snap API
// (https://app.sandbox.midtrans.com/snap/v1/transactions) dan mengembalikan
// redirect_url. verifyWebhook nyatanya memvalidasi signature_key =
// sha512(order_id + status_code + gross_amount + server_key).

class MidtransGateway implements PaymentGateway {
  readonly name = "midtrans" as const;

  private get serverKey(): string {
    const key = process.env.MIDTRANS_SERVER_KEY ?? "";
    if (!key) notConfigured(this.name);
    return key;
  }

  async createCharge(_order: Order): Promise<ChargeResult> {
    // Memastikan kunci tersedia; bila tidak → "belum dikonfigurasi".
    this.serverKey;
    // SCAFFOLD: implementasi nyata memanggil Snap API Midtrans di sini.
    throw new Error('Integrasi Midtrans belum dikonfigurasi (createCharge masih scaffold)');
  }

  async verifyWebhook(_req: Request): Promise<WebhookResult> {
    this.serverKey;
    // SCAFFOLD: implementasi nyata memvalidasi signature_key & mem-parse payload.
    throw new Error('Integrasi Midtrans belum dikonfigurasi (verifyWebhook masih scaffold)');
  }
}

// ===================== Xendit (STUB) =====================
//
// Kunci dibaca dari env: XENDIT_SECRET_KEY, XENDIT_WEBHOOK_TOKEN. createCharge
// nyatanya memanggil Invoice API (https://api.xendit.co/v2/invoices) dan
// mengembalikan invoice_url. verifyWebhook nyatanya memvalidasi header
// "x-callback-token" terhadap XENDIT_WEBHOOK_TOKEN.

class XenditGateway implements PaymentGateway {
  readonly name = "xendit" as const;

  private get secretKey(): string {
    const key = process.env.XENDIT_SECRET_KEY ?? "";
    if (!key) notConfigured(this.name);
    return key;
  }

  async createCharge(_order: Order): Promise<ChargeResult> {
    this.secretKey;
    // SCAFFOLD: implementasi nyata memanggil Invoice API Xendit di sini.
    throw new Error('Integrasi Xendit belum dikonfigurasi (createCharge masih scaffold)');
  }

  async verifyWebhook(_req: Request): Promise<WebhookResult> {
    this.secretKey;
    // SCAFFOLD: implementasi nyata memvalidasi x-callback-token & mem-parse payload.
    throw new Error('Integrasi Xendit belum dikonfigurasi (verifyWebhook masih scaffold)');
  }
}

/** Nama gateway aktif menurut env (atau null bila transfer manual). */
export function activeGatewayName(): GatewayName | null {
  const name = (process.env.PAYMENT_GATEWAY ?? "").trim().toLowerCase();
  if (name === "midtrans" || name === "xendit") return name;
  return null;
}

/** Apakah server key / secret key untuk gateway aktif sudah diisi. */
export function hasServerKey(name: GatewayName): boolean {
  if (name === "midtrans") return !!(process.env.MIDTRANS_SERVER_KEY ?? "");
  if (name === "xendit") return !!(process.env.XENDIT_SECRET_KEY ?? "");
  return false;
}

/** Apakah secret webhook untuk gateway aktif sudah diisi. */
export function hasWebhookSecret(name: GatewayName): boolean {
  if (name === "midtrans") return !!(process.env.MIDTRANS_WEBHOOK_SECRET ?? "");
  if (name === "xendit") return !!(process.env.XENDIT_WEBHOOK_TOKEN ?? "");
  return false;
}

/**
 * Factory: mengembalikan instance gateway sesuai env.PAYMENT_GATEWAY,
 * atau null bila kosong/tidak dikenal (mode transfer manual).
 */
export function getGateway(): PaymentGateway | null {
  const name = activeGatewayName();
  if (name === "midtrans") return new MidtransGateway();
  if (name === "xendit") return new XenditGateway();
  return null;
}
