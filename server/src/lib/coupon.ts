import { prisma } from "../db.js";

export type CouponEval = {
  valid: boolean;
  reason: string | null;
  discount_idr: number;
  coupon: Awaited<ReturnType<typeof prisma.coupon.findUnique>>;
};

/**
 * Evaluate a coupon against a course purchase WITHOUT redeeming it.
 * Coupons apply to course orders only.
 */
export async function evaluateCoupon(opts: {
  code: string;
  course_id: string;
  base_price_idr: number;
}): Promise<CouponEval> {
  const code = opts.code.trim().toUpperCase();
  const fail = (reason: string): CouponEval => ({ valid: false, reason, discount_idr: 0, coupon: null });

  if (!code) return fail("Kode kosong");
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.is_active) return fail("Kode tidak valid");
  if (coupon.expires_at && coupon.expires_at < new Date()) return fail("Kode sudah kedaluwarsa");
  if (coupon.course_id && coupon.course_id !== opts.course_id) return fail("Kode tidak berlaku untuk kelas ini");
  if (coupon.max_uses != null && coupon.used_count >= coupon.max_uses) return fail("Kuota kode sudah habis");
  if (coupon.min_purchase_idr != null && opts.base_price_idr < coupon.min_purchase_idr)
    return fail("Belum memenuhi minimum pembelian");

  let discount =
    coupon.discount_type === "percentage"
      ? Math.floor((opts.base_price_idr * coupon.discount_value) / 100)
      : coupon.discount_value;
  if (coupon.max_discount_idr != null) discount = Math.min(discount, coupon.max_discount_idr);
  discount = Math.max(0, Math.min(discount, opts.base_price_idr));

  return { valid: true, reason: null, discount_idr: discount, coupon };
}
