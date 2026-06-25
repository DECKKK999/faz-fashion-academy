import { Router } from "express";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth, requireAdmin } from "../auth.js";
import { uploadProof } from "../upload.js";
import { ORDER_EXPIRY_HOURS, UNIQUE_CODE_MIN, UNIQUE_CODE_MAX } from "../config/payment.js";
import { evaluateCoupon } from "../lib/coupon.js";
import { sendMailSafe, templates } from "../mailer/index.js";

export const ordersRouter = Router();
export const adminOrdersRouter = Router();

const ACTIVE_STATUSES = ["pending", "awaiting_verification"] as const;

function randomUniqueCode() {
  return Math.floor(Math.random() * (UNIQUE_CODE_MAX - UNIQUE_CODE_MIN + 1)) + UNIQUE_CODE_MIN;
}

function ticketCode() {
  const raw = randomBytes(6).toString("hex").toUpperCase();
  return `FAZ-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

async function sweepExpired() {
  await prisma.order.updateMany({
    where: { status: "pending", expires_at: { lt: new Date() } },
    data: { status: "expired" },
  });
}

const courseSelect = { id: true, slug: true, title: true, cover_image_url: true, level: true, category: true, instructor_name: true };
const ebookSelect = { id: true, slug: true, title: true, cover_image_url: true, category: true, author: true };
const eventSelect = { id: true, slug: true, title: true, cover_image_url: true, category: true, date_label: true, location: true };

const orderInclude = {
  course: { select: courseSelect },
  ebook: { select: ebookSelect },
  event: { select: eventSelect },
};
const adminOrderInclude = {
  ...orderInclude,
  user: { select: { id: true, email: true, profile: { select: { full_name: true } } } },
};

function itemTitle(order: any): string {
  return order.course?.title ?? order.ebook?.title ?? order.event?.title ?? "Pesanan";
}

async function displayName(userId: string, email: string) {
  const p = await prisma.profile.findUnique({ where: { user_id: userId }, select: { full_name: true } });
  return p?.full_name || email.split("@")[0];
}

const EXPIRY = () => new Date(Date.now() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000);

// ============ BUYER: create orders ============

// POST /api/orders  { course_id, coupon_code? }
ordersRouter.post("/", requireAuth, async (req, res) => {
  const parsed = z
    .object({ course_id: z.string().uuid(), coupon_code: z.string().optional() })
    .safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "course_id tidak valid" });
  const { course_id, coupon_code } = parsed.data;
  const userId = req.user!.id;

  const course = await prisma.course.findUnique({ where: { id: course_id } });
  if (!course || !course.is_published) return res.status(404).json({ error: "Kelas tidak ditemukan" });

  const enrolled = await prisma.enrollment.findUnique({ where: { user_id_course_id: { user_id: userId, course_id } } });
  if (enrolled) return res.status(409).json({ error: "Kamu sudah memiliki kelas ini", enrolled: true });

  if (course.price_idr <= 0) {
    await prisma.enrollment.create({ data: { user_id: userId, course_id } });
    return res.status(201).json({ free: true });
  }

  const existing = await prisma.order.findFirst({
    where: { user_id: userId, course_id, item_type: "course", status: { in: [...ACTIVE_STATUSES] } },
    include: orderInclude,
  });
  if (existing) return res.status(200).json({ order: existing, resumed: true });

  // kupon (opsional)
  let discount_idr = 0;
  let coupon_id: string | null = null;
  let coupon_code_snap: string | null = null;
  if (coupon_code) {
    const ev = await evaluateCoupon({ code: coupon_code, course_id, base_price_idr: course.price_idr });
    if (ev.valid && ev.coupon) {
      discount_idr = ev.discount_idr;
      coupon_id = ev.coupon.id;
      coupon_code_snap = ev.coupon.code;
    }
  }

  const unique_code = randomUniqueCode();
  const base_price_idr = course.price_idr;
  const total_idr = Math.max(0, base_price_idr - discount_idr) + unique_code;

  const order = await prisma.$transaction(async (tx) => {
    const created = await tx.order.create({
      data: {
        user_id: userId,
        item_type: "course",
        course_id,
        base_price_idr,
        unique_code,
        discount_idr,
        total_idr,
        coupon_id,
        coupon_code: coupon_code_snap,
        expires_at: EXPIRY(),
      },
      include: orderInclude,
    });
    if (coupon_id) {
      await tx.couponRedemption.create({
        data: { coupon_id, user_id: userId, order_id: created.id, course_id, discount_idr },
      });
      await tx.coupon.update({ where: { id: coupon_id }, data: { used_count: { increment: 1 } } });
    }
    return created;
  });

  const name = await displayName(userId, req.user!.email);
  sendMailSafe({
    to: req.user!.email,
    user_id: userId,
    order_id: order.id,
    ...templates.orderCreated({ name, itemTitle: course.title, totalIdr: order.total_idr, uniqueCode: order.unique_code, orderId: order.id }),
  });

  return res.status(201).json({ order });
});

// POST /api/orders/ebook  { ebook_id }
ordersRouter.post("/ebook", requireAuth, async (req, res) => {
  const parsed = z.object({ ebook_id: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "ebook_id tidak valid" });
  const { ebook_id } = parsed.data;
  const userId = req.user!.id;

  const ebook = await prisma.ebook.findUnique({ where: { id: ebook_id } });
  if (!ebook || !ebook.is_published) return res.status(404).json({ error: "E-book tidak ditemukan" });

  const grant = await prisma.ebookGrant.findUnique({ where: { user_id_ebook_id: { user_id: userId, ebook_id } } });
  if (grant) return res.status(409).json({ error: "Kamu sudah memiliki e-book ini", granted: true });

  if (ebook.price_idr <= 0) {
    await prisma.ebookGrant.create({ data: { user_id: userId, ebook_id } });
    return res.status(201).json({ free: true });
  }

  const existing = await prisma.order.findFirst({
    where: { user_id: userId, ebook_id, item_type: "ebook", status: { in: [...ACTIVE_STATUSES] } },
    include: orderInclude,
  });
  if (existing) return res.status(200).json({ order: existing, resumed: true });

  const unique_code = randomUniqueCode();
  const order = await prisma.order.create({
    data: {
      user_id: userId,
      item_type: "ebook",
      ebook_id,
      base_price_idr: ebook.price_idr,
      unique_code,
      total_idr: ebook.price_idr + unique_code,
      expires_at: EXPIRY(),
    },
    include: orderInclude,
  });

  const name = await displayName(userId, req.user!.email);
  sendMailSafe({ to: req.user!.email, user_id: userId, order_id: order.id, ...templates.orderCreated({ name, itemTitle: ebook.title, totalIdr: order.total_idr, uniqueCode: order.unique_code, orderId: order.id }) });
  return res.status(201).json({ order });
});

// POST /api/orders/event  { event_id }
ordersRouter.post("/event", requireAuth, async (req, res) => {
  const parsed = z.object({ event_id: z.string().uuid() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "event_id tidak valid" });
  const { event_id } = parsed.data;
  const userId = req.user!.id;

  const event = await prisma.event.findUnique({ where: { id: event_id } });
  if (!event || !event.is_published) return res.status(404).json({ error: "Event tidak ditemukan" });

  const ticket = await prisma.eventTicket.findUnique({ where: { user_id_event_id: { user_id: userId, event_id } } });
  if (ticket) return res.status(409).json({ error: "Kamu sudah punya tiket event ini", ticketed: true });

  if (event.spots_left != null && event.spots_left <= 0) return res.status(409).json({ error: "Tiket sudah habis" });

  if (event.is_free || event.price_idr <= 0) {
    await prisma.$transaction(async (tx) => {
      await tx.eventTicket.create({ data: { user_id: userId, event_id, ticket_code: ticketCode() } });
      if (event.spots_left != null) await tx.event.update({ where: { id: event_id }, data: { spots_left: Math.max(0, event.spots_left - 1) } });
    });
    return res.status(201).json({ free: true });
  }

  const existing = await prisma.order.findFirst({
    where: { user_id: userId, event_id, item_type: "event", status: { in: [...ACTIVE_STATUSES] } },
    include: orderInclude,
  });
  if (existing) return res.status(200).json({ order: existing, resumed: true });

  const unique_code = randomUniqueCode();
  const order = await prisma.order.create({
    data: {
      user_id: userId,
      item_type: "event",
      event_id,
      base_price_idr: event.price_idr,
      unique_code,
      total_idr: event.price_idr + unique_code,
      expires_at: EXPIRY(),
    },
    include: orderInclude,
  });

  const name = await displayName(userId, req.user!.email);
  sendMailSafe({ to: req.user!.email, user_id: userId, order_id: order.id, ...templates.orderCreated({ name, itemTitle: event.title, totalIdr: order.total_idr, uniqueCode: order.unique_code, orderId: order.id }) });
  return res.status(201).json({ order });
});

// ============ BUYER: read / proof / cancel ============

ordersRouter.get("/", requireAuth, async (req, res) => {
  await sweepExpired();
  const orders = await prisma.order.findMany({ where: { user_id: req.user!.id }, include: orderInclude, orderBy: { created_at: "desc" } });
  res.json(orders);
});

// GET /api/orders/group/:groupId — semua order dalam satu grup (cart checkout)
ordersRouter.get("/group/:groupId", requireAuth, async (req, res) => {
  await sweepExpired();
  const orders = await prisma.order.findMany({
    where: { order_group_id: req.params.groupId, user_id: req.user!.id },
    include: orderInclude,
    orderBy: { created_at: "asc" },
  });
  if (orders.length === 0) return res.status(404).json({ error: "Grup pesanan tidak ditemukan" });
  const total_idr = orders.reduce((s, o) => s + o.total_idr, 0);
  res.json({ order_group_id: req.params.groupId, orders, total_idr });
});

ordersRouter.get("/:id", requireAuth, async (req, res) => {
  await sweepExpired();
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: orderInclude });
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
  const isAdmin = req.user!.roles.includes("admin");
  if (order.user_id !== req.user!.id && !isAdmin) return res.status(404).json({ error: "Order tidak ditemukan" });
  res.json(order);
});

ordersRouter.post("/:id/proof", requireAuth, uploadProof.single("proof"), async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.user_id !== req.user!.id) return res.status(404).json({ error: "Order tidak ditemukan" });
  if (!["pending", "rejected"].includes(order.status)) return res.status(400).json({ error: "Order tidak dapat diperbarui pada status ini" });
  if (order.status === "pending" && order.expires_at < new Date()) return res.status(400).json({ error: "Batas waktu pembayaran sudah lewat" });
  if (!req.file) return res.status(400).json({ error: "Bukti transfer wajib diunggah" });

  const schema = z.object({
    payer_name: z.string().trim().min(1, "Nama pengirim wajib diisi"),
    payer_bank: z.string().trim().min(1, "Bank pengirim wajib diisi"),
    transfer_date: z.string().trim().optional(),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      proof_url: `/api/uploads/${req.file.filename}`,
      payer_name: parsed.data.payer_name,
      payer_bank: parsed.data.payer_bank,
      transfer_date: parsed.data.transfer_date ?? null,
      submitted_at: new Date(),
      status: "awaiting_verification",
      rejection_reason: null,
    },
    include: orderInclude,
  });
  res.json(updated);
});

ordersRouter.post("/:id/cancel", requireAuth, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order || order.user_id !== req.user!.id) return res.status(404).json({ error: "Order tidak ditemukan" });
  if (!["pending", "awaiting_verification"].includes(order.status)) return res.status(400).json({ error: "Order tidak dapat dibatalkan" });
  const updated = await prisma.order.update({ where: { id: order.id }, data: { status: "cancelled" }, include: orderInclude });
  res.json(updated);
});

// ============ ADMIN / STAFF ============

adminOrdersRouter.get("/", ...requireAdmin, async (req, res) => {
  await sweepExpired();
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const where = status && status !== "all" ? { status: status as any } : {};
  const orders = await prisma.order.findMany({ where, include: adminOrderInclude, orderBy: [{ submitted_at: "desc" }, { created_at: "desc" }] });
  res.json(orders);
});

// Buat entitlement sesuai jenis item, lalu set order paid — semua dalam satu transaksi.
adminOrdersRouter.post("/:id/approve", ...requireAdmin, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id }, include: { event: true } });
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
  if (order.status === "paid") return res.json({ ...order, already: true });
  if (!["awaiting_verification", "pending", "rejected"].includes(order.status))
    return res.status(400).json({ error: "Order tidak dapat diverifikasi pada status ini" });

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: { status: "paid", verified_by: req.user!.id, verified_at: new Date(), rejection_reason: null },
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
      const existing = await tx.eventTicket.findUnique({ where: { user_id_event_id: { user_id: order.user_id, event_id: order.event_id } } });
      if (!existing) {
        await tx.eventTicket.create({ data: { user_id: order.user_id, event_id: order.event_id, order_id: order.id, ticket_code: ticketCode() } });
        if (order.event?.spots_left != null) {
          await tx.event.update({ where: { id: order.event_id }, data: { spots_left: Math.max(0, order.event.spots_left - 1) } });
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
      ...templates.paymentVerified({ name: full.user.profile?.full_name || full.user.email.split("@")[0], itemTitle: itemTitle(full) }),
    });
  }
  res.json(full);
});

adminOrdersRouter.post("/:id/reject", ...requireAdmin, async (req, res) => {
  const parsed = z.object({ reason: z.string().trim().min(1, "Alasan wajib diisi") }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });

  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order tidak ditemukan" });
  if (order.status === "paid") return res.status(400).json({ error: "Order sudah lunas, tidak dapat ditolak" });

  const updated = await prisma.order.update({
    where: { id: order.id },
    data: { status: "rejected", rejection_reason: parsed.data.reason, verified_by: req.user!.id, verified_at: new Date() },
    include: adminOrderInclude,
  });

  if (updated.user?.email) {
    sendMailSafe({
      to: updated.user.email,
      user_id: updated.user_id,
      order_id: updated.id,
      ...templates.paymentRejected({ name: updated.user.profile?.full_name || updated.user.email.split("@")[0], itemTitle: itemTitle(updated), reason: parsed.data.reason, orderId: updated.id }),
    });
  }
  res.json(updated);
});
