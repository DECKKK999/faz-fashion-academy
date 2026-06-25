import { Router } from "express";
import { randomBytes, randomUUID } from "node:crypto";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import { ORDER_EXPIRY_HOURS, UNIQUE_CODE_MIN, UNIQUE_CODE_MAX } from "../config/payment.js";
import { sendMailSafe, templates } from "../mailer/index.js";
import type { OrderItemType } from "@prisma/client";

export const cartRouter = Router();

const EXPIRY = () => new Date(Date.now() + ORDER_EXPIRY_HOURS * 60 * 60 * 1000);

function randomUniqueCode() {
  return Math.floor(Math.random() * (UNIQUE_CODE_MAX - UNIQUE_CODE_MIN + 1)) + UNIQUE_CODE_MIN;
}

function ticketCode() {
  const raw = randomBytes(6).toString("hex").toUpperCase();
  return `FAZ-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

const productTypeEnum = z.enum(["course", "ebook", "event"]);

const itemInput = z.object({
  product_type: productTypeEnum,
  product_id: z.string().uuid(),
});

// Ambil produk live + slug, atau null bila tidak ada / tidak terbit.
async function loadProduct(product_type: OrderItemType, product_id: string) {
  if (product_type === "course") {
    const c = await prisma.course.findUnique({
      where: { id: product_id },
      select: { id: true, slug: true, title: true, cover_image_url: true, price_idr: true, is_published: true },
    });
    if (!c || !c.is_published) return null;
    return { id: c.id, slug: c.slug, title: c.title, cover_image_url: c.cover_image_url, price_idr: c.price_idr };
  }
  if (product_type === "ebook") {
    const e = await prisma.ebook.findUnique({
      where: { id: product_id },
      select: { id: true, slug: true, title: true, cover_image_url: true, price_idr: true, is_published: true },
    });
    if (!e || !e.is_published) return null;
    return { id: e.id, slug: e.slug, title: e.title, cover_image_url: e.cover_image_url, price_idr: e.price_idr };
  }
  const ev = await prisma.event.findUnique({
    where: { id: product_id },
    select: { id: true, slug: true, title: true, cover_image_url: true, price_idr: true, is_free: true, is_published: true },
  });
  if (!ev || !ev.is_published) return null;
  return { id: ev.id, slug: ev.slug, title: ev.title, cover_image_url: ev.cover_image_url, price_idr: ev.is_free ? 0 : ev.price_idr };
}

// Pastikan keranjang ada untuk user (idempoten).
async function ensureCart(userId: string) {
  return prisma.cart.upsert({
    where: { user_id: userId },
    create: { user_id: userId },
    update: {},
  });
}

// Susun respons keranjang: gabungkan item dengan produk live (harga/judul/cover terkini + stale_price).
async function buildCartResponse(userId: string) {
  const cart = await ensureCart(userId);
  const rows = await prisma.cartItem.findMany({
    where: { cart_id: cart.id },
    orderBy: { created_at: "asc" },
  });

  const items = await Promise.all(
    rows.map(async (row) => {
      const live = await loadProduct(row.product_type, row.product_id);
      return {
        id: row.id,
        product_type: row.product_type,
        product_id: row.product_id,
        // Harga & metadata live bila masih ada, jika produk hilang/tak terbit jatuh ke snapshot.
        price_idr: live ? live.price_idr : row.price_idr,
        title_snapshot: live ? live.title : row.title_snapshot,
        cover_snapshot: live ? live.cover_image_url : row.cover_snapshot,
        slug: live?.slug,
        stale_price: live ? live.price_idr !== row.price_idr : false,
      };
    })
  );

  const total_idr = items.reduce((s, i) => s + i.price_idr, 0);
  return { id: cart.id, items, total_idr };
}

// GET /api/cart — isi keranjang user (item digabung produk live)
cartRouter.get("/", requireAuth, async (req, res) => {
  res.json(await buildCartResponse(req.user!.id));
});

// POST /api/cart/items { product_type, product_id }
cartRouter.post("/items", requireAuth, async (req, res) => {
  const parsed = itemInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Produk tidak valid" });
  const { product_type, product_id } = parsed.data;
  const userId = req.user!.id;

  const live = await loadProduct(product_type, product_id);
  if (!live) return res.status(404).json({ error: "Produk tidak ditemukan" });

  // Cegah menambah kelas yang sudah dimiliki.
  if (product_type === "course") {
    const enrolled = await prisma.enrollment.findUnique({
      where: { user_id_course_id: { user_id: userId, course_id: product_id } },
    });
    if (enrolled) return res.status(409).json({ error: "Kamu sudah memiliki kelas ini" });
  } else if (product_type === "ebook") {
    const grant = await prisma.ebookGrant.findUnique({
      where: { user_id_ebook_id: { user_id: userId, ebook_id: product_id } },
    });
    if (grant) return res.status(409).json({ error: "Kamu sudah memiliki e-book ini" });
  } else if (product_type === "event") {
    const ticket = await prisma.eventTicket.findUnique({
      where: { user_id_event_id: { user_id: userId, event_id: product_id } },
    });
    if (ticket) return res.status(409).json({ error: "Kamu sudah punya tiket event ini" });
  }

  const cart = await ensureCart(userId);
  await prisma.cartItem.upsert({
    where: { cart_id_product_type_product_id: { cart_id: cart.id, product_type, product_id } },
    create: {
      cart_id: cart.id,
      product_type,
      product_id,
      price_idr: live.price_idr,
      title_snapshot: live.title,
      cover_snapshot: live.cover_image_url,
    },
    update: {
      // Segarkan snapshot saat item ditambah ulang.
      price_idr: live.price_idr,
      title_snapshot: live.title,
      cover_snapshot: live.cover_image_url,
    },
  });

  res.status(201).json(await buildCartResponse(userId));
});

// DELETE /api/cart/items/:id
cartRouter.delete("/items/:id", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const cart = await ensureCart(userId);
  const item = await prisma.cartItem.findUnique({ where: { id: req.params.id } });
  if (!item || item.cart_id !== cart.id) return res.status(404).json({ error: "Item tidak ditemukan" });
  await prisma.cartItem.delete({ where: { id: item.id } });
  res.json(await buildCartResponse(userId));
});

// DELETE /api/cart — kosongkan keranjang
cartRouter.delete("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const cart = await ensureCart(userId);
  await prisma.cartItem.deleteMany({ where: { cart_id: cart.id } });
  res.json(await buildCartResponse(userId));
});

// POST /api/cart/merge { items: [{product_type, product_id}] } — gabungkan keranjang tamu
cartRouter.post("/merge", requireAuth, async (req, res) => {
  const parsed = z.object({ items: z.array(itemInput).max(100) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Data keranjang tidak valid" });
  const userId = req.user!.id;
  const cart = await ensureCart(userId);

  for (const it of parsed.data.items) {
    const live = await loadProduct(it.product_type, it.product_id);
    if (!live) continue; // lewati produk tak valid

    // Lewati produk yang sudah dimiliki.
    if (it.product_type === "course") {
      const enrolled = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: it.product_id } },
      });
      if (enrolled) continue;
    } else if (it.product_type === "ebook") {
      const grant = await prisma.ebookGrant.findUnique({
        where: { user_id_ebook_id: { user_id: userId, ebook_id: it.product_id } },
      });
      if (grant) continue;
    } else if (it.product_type === "event") {
      const ticket = await prisma.eventTicket.findUnique({
        where: { user_id_event_id: { user_id: userId, event_id: it.product_id } },
      });
      if (ticket) continue;
    }

    await prisma.cartItem.upsert({
      where: { cart_id_product_type_product_id: { cart_id: cart.id, product_type: it.product_type, product_id: it.product_id } },
      create: {
        cart_id: cart.id,
        product_type: it.product_type,
        product_id: it.product_id,
        price_idr: live.price_idr,
        title_snapshot: live.title,
        cover_snapshot: live.cover_image_url,
      },
      update: {},
    });
  }

  res.json(await buildCartResponse(userId));
});

// POST /api/cart/checkout — buat satu Order per item dalam SATU transaksi berbagi order_group_id
cartRouter.post("/checkout", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const email = req.user!.email;
  const cart = await ensureCart(userId);
  const rows = await prisma.cartItem.findMany({ where: { cart_id: cart.id }, orderBy: { created_at: "asc" } });
  if (rows.length === 0) return res.status(400).json({ error: "Keranjang kosong" });

  // Validasi setiap item terhadap produk live + entitlement saat ini.
  type PayItem = { product_type: OrderItemType; product_id: string; title: string; cover: string | null; price_idr: number };
  const payItems: PayItem[] = [];
  const freeCourseIds: string[] = [];
  const freeEbookIds: string[] = [];
  const freeEvents: { event_id: string }[] = [];

  for (const row of rows) {
    const live = await loadProduct(row.product_type, row.product_id);
    if (!live) continue; // produk hilang/tak terbit → lewati

    if (row.product_type === "course") {
      const enrolled = await prisma.enrollment.findUnique({
        where: { user_id_course_id: { user_id: userId, course_id: row.product_id } },
      });
      if (enrolled) continue;
      if (live.price_idr <= 0) {
        freeCourseIds.push(row.product_id);
        continue;
      }
    } else if (row.product_type === "ebook") {
      const grant = await prisma.ebookGrant.findUnique({
        where: { user_id_ebook_id: { user_id: userId, ebook_id: row.product_id } },
      });
      if (grant) continue;
      if (live.price_idr <= 0) {
        freeEbookIds.push(row.product_id);
        continue;
      }
    } else if (row.product_type === "event") {
      const ticket = await prisma.eventTicket.findUnique({
        where: { user_id_event_id: { user_id: userId, event_id: row.product_id } },
      });
      if (ticket) continue;
      if (live.price_idr <= 0) {
        freeEvents.push({ event_id: row.product_id });
        continue;
      }
    }

    payItems.push({
      product_type: row.product_type,
      product_id: row.product_id,
      title: live.title,
      cover: live.cover_image_url,
      price_idr: live.price_idr,
    });
  }

  const order_group_id = randomUUID();
  const expires_at = EXPIRY();

  const created = await prisma.$transaction(async (tx) => {
    // Enroll/grant item gratis langsung.
    for (const course_id of freeCourseIds) {
      await tx.enrollment.upsert({
        where: { user_id_course_id: { user_id: userId, course_id } },
        create: { user_id: userId, course_id },
        update: {},
      });
    }
    for (const ebook_id of freeEbookIds) {
      await tx.ebookGrant.upsert({
        where: { user_id_ebook_id: { user_id: userId, ebook_id } },
        create: { user_id: userId, ebook_id },
        update: {},
      });
    }
    for (const { event_id } of freeEvents) {
      const existing = await tx.eventTicket.findUnique({ where: { user_id_event_id: { user_id: userId, event_id } } });
      if (!existing) {
        await tx.eventTicket.create({ data: { user_id: userId, event_id, ticket_code: ticketCode() } });
        const ev = await tx.event.findUnique({ where: { id: event_id }, select: { spots_left: true } });
        if (ev?.spots_left != null) {
          await tx.event.update({ where: { id: event_id }, data: { spots_left: Math.max(0, ev.spots_left - 1) } });
        }
      }
    }

    const orders = [];
    for (const it of payItems) {
      const unique_code = randomUniqueCode();
      const base_price_idr = it.price_idr;
      const total_idr = base_price_idr + unique_code;
      const order = await tx.order.create({
        data: {
          user_id: userId,
          item_type: it.product_type,
          course_id: it.product_type === "course" ? it.product_id : null,
          ebook_id: it.product_type === "ebook" ? it.product_id : null,
          event_id: it.product_type === "event" ? it.product_id : null,
          base_price_idr,
          unique_code,
          discount_idr: 0,
          total_idr,
          order_group_id,
          expires_at,
        },
        include: {
          course: { select: { id: true, slug: true, title: true, cover_image_url: true, level: true, category: true, instructor_name: true } },
          ebook: { select: { id: true, slug: true, title: true, cover_image_url: true, category: true, author: true } },
          event: { select: { id: true, slug: true, title: true, cover_image_url: true, category: true, date_label: true, location: true } },
        },
      });
      orders.push(order);
    }

    // Kosongkan keranjang setelah checkout.
    await tx.cartItem.deleteMany({ where: { cart_id: cart.id } });

    return orders;
  });

  const total_idr = created.reduce((s, o) => s + o.total_idr, 0);

  // Kirim email konfirmasi pesanan grup (tidak menggagalkan checkout bila gagal).
  const profile = await prisma.profile.findUnique({ where: { user_id: userId }, select: { full_name: true } });
  const name = profile?.full_name || email.split("@")[0];
  if (created.length > 0) {
    const itemTitle =
      created.length === 1
        ? created[0].course?.title ?? created[0].ebook?.title ?? created[0].event?.title ?? "Pesanan"
        : `${created.length} item`;
    sendMailSafe({
      to: email,
      user_id: userId,
      order_id: created[0].id,
      ...templates.orderCreated({ name, itemTitle, totalIdr: total_idr, uniqueCode: created[0].unique_code, orderId: created[0].id }),
    });
  }

  res.status(201).json({ order_group_id, orders: created, total_idr });
});
