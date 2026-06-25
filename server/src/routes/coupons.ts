import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { evaluateCoupon } from "../lib/coupon.js";

export const couponsRouter = Router();
export const adminCouponsRouter = Router();

// ============ BUYER: validate a coupon against a course (no redemption) ============

// POST /api/coupons/validate  { code, course_id }
// Returns CouponValidation; responds 200 even on soft-fail (valid:false + reason).
couponsRouter.post("/validate", requireAuth, async (req, res) => {
  const parsed = z
    .object({ code: z.string().trim().min(1, "Kode kupon wajib diisi"), course_id: z.string().uuid("course_id tidak valid") })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const { code, course_id } = parsed.data;
  const userId = req.user!.id;

  const course = await prisma.course.findUnique({ where: { id: course_id } });
  if (!course || !course.is_published) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const base_price_idr = course.price_idr;

  const soft = (reason: string) =>
    res.json({ valid: false, code: code.trim().toUpperCase(), discount_idr: 0, base_price_idr, total_preview_idr: base_price_idr, reason });

  // Kupon tidak berlaku untuk kelas gratis.
  if (base_price_idr <= 0) return soft("Kelas ini gratis, kupon tidak berlaku");

  // Sudah terdaftar di kelas ini.
  const enrolled = await prisma.enrollment.findUnique({ where: { user_id_course_id: { user_id: userId, course_id } } });
  if (enrolled) return soft("Kamu sudah memiliki kelas ini");

  const ev = await evaluateCoupon({ code, course_id, base_price_idr });
  if (!ev.valid || !ev.coupon) return soft(ev.reason ?? "Kode tidak valid");

  const discount_idr = ev.discount_idr;
  const total_preview_idr = Math.max(0, base_price_idr - discount_idr);

  return res.json({
    valid: true,
    code: ev.coupon.code,
    discount_idr,
    base_price_idr,
    total_preview_idr,
  });
});

// ============ ADMIN: CRUD + redemptions ============

const createSchema = z.object({
  code: z.string().trim().min(1, "Kode wajib diisi"),
  description: z.string().trim().nullable().optional(),
  discount_type: z.enum(["percentage", "fixed"]),
  discount_value: z.number().int().positive("Nilai diskon harus lebih dari 0"),
  course_id: z.string().uuid().nullable().optional(),
  max_uses: z.number().int().positive().nullable().optional(),
  max_discount_idr: z.number().int().nonnegative().nullable().optional(),
  min_purchase_idr: z.number().int().nonnegative().nullable().optional(),
  expires_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().optional(),
});
const updateSchema = createSchema.partial();

const couponInclude = { course: { select: { id: true, title: true } } } as const;

function normalizeData<T extends { code?: string; expires_at?: string | null }>(data: T) {
  const out: any = { ...data };
  if (typeof out.code === "string") out.code = out.code.trim().toUpperCase();
  if (out.expires_at !== undefined) out.expires_at = out.expires_at ? new Date(out.expires_at) : null;
  return out;
}

// Tolak percentage di luar 1-100.
function validatePercentage(discount_type: string | undefined, discount_value: number | undefined): string | null {
  if (discount_type === "percentage" && discount_value != null && (discount_value < 1 || discount_value > 100)) {
    return "Diskon persentase harus antara 1 dan 100";
  }
  return null;
}

// GET /api/admin/coupons — daftar kupon
adminCouponsRouter.get("/", ...requireAdmin, async (_req, res) => {
  const coupons = await prisma.coupon.findMany({ include: couponInclude, orderBy: { created_at: "desc" } });
  res.json(coupons);
});

// POST /api/admin/coupons — buat kupon
adminCouponsRouter.post("/", ...requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const pctError = validatePercentage(parsed.data.discount_type, parsed.data.discount_value);
  if (pctError) return res.status(400).json({ error: pctError });

  // course_id kosong/null = kupon global.
  if (parsed.data.course_id) {
    const course = await prisma.course.findUnique({ where: { id: parsed.data.course_id }, select: { id: true } });
    if (!course) return res.status(400).json({ error: "Kelas tidak ditemukan" });
  }

  try {
    const coupon = await prisma.coupon.create({ data: normalizeData(parsed.data), include: couponInclude });
    res.status(201).json(coupon);
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ error: "Kode kupon sudah dipakai" });
    throw e;
  }
});

// PATCH /api/admin/coupons/:id — ubah kupon
adminCouponsRouter.patch("/:id", ...requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const pctError = validatePercentage(parsed.data.discount_type, parsed.data.discount_value);
  if (pctError) return res.status(400).json({ error: pctError });

  if (parsed.data.course_id) {
    const course = await prisma.course.findUnique({ where: { id: parsed.data.course_id }, select: { id: true } });
    if (!course) return res.status(400).json({ error: "Kelas tidak ditemukan" });
  }

  try {
    const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: normalizeData(parsed.data), include: couponInclude });
    res.json(coupon);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Kupon tidak ditemukan" });
    if (e?.code === "P2002") return res.status(409).json({ error: "Kode kupon sudah dipakai" });
    throw e;
  }
});

// DELETE /api/admin/coupons/:id — hapus kupon
adminCouponsRouter.delete("/:id", ...requireAdmin, async (req, res) => {
  try {
    await prisma.coupon.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Kupon tidak ditemukan" });
    throw e;
  }
});

// GET /api/admin/coupons/:id/redemptions — riwayat penggunaan kupon
adminCouponsRouter.get("/:id/redemptions", ...requireAdmin, async (req, res) => {
  const coupon = await prisma.coupon.findUnique({ where: { id: req.params.id }, select: { id: true } });
  if (!coupon) return res.status(404).json({ error: "Kupon tidak ditemukan" });

  const redemptions = await prisma.couponRedemption.findMany({
    where: { coupon_id: req.params.id },
    orderBy: { created_at: "desc" },
    include: {
      user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
      order: { select: { id: true, status: true, total_idr: true, base_price_idr: true, created_at: true, item_type: true } },
    },
  });
  res.json(redemptions);
});
