import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";
import type { OrderItemType } from "@prisma/client";

export const wishlistRouter = Router();

const productTypeEnum = z.enum(["course", "ebook", "event"]);

const itemInput = z.object({
  product_type: productTypeEnum,
  product_id: z.string().uuid(),
});

// Ambil produk live + metadata, atau null bila tidak ada / tidak terbit.
async function loadProduct(product_type: OrderItemType, product_id: string) {
  if (product_type === "course") {
    const c = await prisma.course.findUnique({
      where: { id: product_id },
      select: { id: true, slug: true, title: true, cover_image_url: true, price_idr: true, is_published: true },
    });
    if (!c || !c.is_published) return null;
    return { slug: c.slug, title: c.title, cover_image_url: c.cover_image_url, price_idr: c.price_idr };
  }
  if (product_type === "ebook") {
    const e = await prisma.ebook.findUnique({
      where: { id: product_id },
      select: { id: true, slug: true, title: true, cover_image_url: true, price_idr: true, is_published: true },
    });
    if (!e || !e.is_published) return null;
    return { slug: e.slug, title: e.title, cover_image_url: e.cover_image_url, price_idr: e.price_idr };
  }
  const ev = await prisma.event.findUnique({
    where: { id: product_id },
    select: { id: true, slug: true, title: true, cover_image_url: true, price_idr: true, is_free: true, is_published: true },
  });
  if (!ev || !ev.is_published) return null;
  return { slug: ev.slug, title: ev.title, cover_image_url: ev.cover_image_url, price_idr: ev.is_free ? 0 : ev.price_idr };
}

// Susun respons wishlist: gabungkan baris dengan produk live (drop yang sudah hilang/tak terbit).
async function buildWishlist(userId: string) {
  const rows = await prisma.wishlist.findMany({ where: { user_id: userId }, orderBy: { created_at: "desc" } });
  const items = [];
  for (const row of rows) {
    const live = await loadProduct(row.product_type, row.product_id);
    if (!live) continue;
    items.push({
      id: row.id,
      product_type: row.product_type,
      product_id: row.product_id,
      title: live.title,
      price_idr: live.price_idr,
      cover_image_url: live.cover_image_url,
      slug: live.slug,
    });
  }
  return items;
}

// GET /api/wishlist
wishlistRouter.get("/", requireAuth, async (req, res) => {
  res.json(await buildWishlist(req.user!.id));
});

// POST /api/wishlist/items { product_type, product_id }
wishlistRouter.post("/items", requireAuth, async (req, res) => {
  const parsed = itemInput.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Produk tidak valid" });
  const { product_type, product_id } = parsed.data;
  const userId = req.user!.id;

  const live = await loadProduct(product_type, product_id);
  if (!live) return res.status(404).json({ error: "Produk tidak ditemukan" });

  await prisma.wishlist.upsert({
    where: { user_id_product_type_product_id: { user_id: userId, product_type, product_id } },
    create: { user_id: userId, product_type, product_id },
    update: {},
  });

  res.status(201).json(await buildWishlist(userId));
});

// DELETE /api/wishlist/items/:id
wishlistRouter.delete("/items/:id", requireAuth, async (req, res) => {
  const userId = req.user!.id;
  const item = await prisma.wishlist.findUnique({ where: { id: req.params.id } });
  if (!item || item.user_id !== userId) return res.status(404).json({ error: "Item tidak ditemukan" });
  await prisma.wishlist.delete({ where: { id: item.id } });
  res.json(await buildWishlist(userId));
});

// POST /api/wishlist/merge { items: [{product_type, product_id}] } — gabungkan wishlist tamu
wishlistRouter.post("/merge", requireAuth, async (req, res) => {
  const parsed = z.object({ items: z.array(itemInput).max(200) }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Data wishlist tidak valid" });
  const userId = req.user!.id;

  for (const it of parsed.data.items) {
    const live = await loadProduct(it.product_type, it.product_id);
    if (!live) continue;
    await prisma.wishlist.upsert({
      where: { user_id_product_type_product_id: { user_id: userId, product_type: it.product_type, product_id: it.product_id } },
      create: { user_id: userId, product_type: it.product_type, product_id: it.product_id },
      update: {},
    });
  }

  res.json(await buildWishlist(userId));
});
