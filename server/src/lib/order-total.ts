import { UNIQUE_CODE_MIN, UNIQUE_CODE_MAX } from "../config/payment.js";
import { dokuConfigured, mayarConfigured } from "../env.js";

function randomUniqueCode(): number {
  return Math.floor(Math.random() * (UNIQUE_CODE_MAX - UNIQUE_CODE_MIN + 1)) + UNIQUE_CODE_MIN;
}

/**
 * Kode unik transfer manual (3 digit) hanya berguna untuk staff mencocokkan
 * nominal transfer bank secara manual — begitu ada gateway pembayaran nyata
 * aktif (DOKU/Mayar), pembayaran dicocokkan lewat gateway_ref, jadi kode
 * unik jadi 0 (tidak dipakai) supaya harga yang tertagih tetap bulat.
 */
export function computeOrderTotal(base_price_idr: number, discount_idr: number): { unique_code: number; total_idr: number } {
  const unique_code = dokuConfigured || mayarConfigured ? 0 : randomUniqueCode();
  const total_idr = Math.max(0, base_price_idr - discount_idr) + unique_code;
  return { unique_code, total_idr };
}
