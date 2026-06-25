import { Router } from "express";
import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import { prisma } from "../db.js";
import { optionalAuth, requireAuth, requireManage } from "../auth.js";
import { uploadEbookFile, PROTECTED_DIR } from "../upload.js";

export const ebooksRouter = Router();

function canManage(req: Parameters<typeof optionalAuth>[0]) {
  return req.user?.roles.some((r) => r === "admin" || r === "instructor") ?? false;
}

// Field publik (tanpa file_url, agar path file privat tidak bocor)
const publicSelect = {
  id: true, slug: true, title: true, author: true, category: true, description: true,
  cover_image_url: true, price_idr: true, pages: true, is_published: true, position: true,
  created_at: true, updated_at: true,
};

const createSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  author: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  price_idr: z.number().int().nonnegative().default(0),
  pages: z.number().int().nullable().optional(),
  is_published: z.boolean().optional(),
  position: z.number().int().optional(),
});
const updateSchema = createSchema.partial();

// GET /api/ebooks — managers see all (with file_url); public sees only published (no file_url)
ebooksRouter.get("/", optionalAuth, async (req, res) => {
  if (canManage(req)) {
    return res.json(await prisma.ebook.findMany({ orderBy: [{ position: "asc" }, { created_at: "asc" }] }));
  }
  res.json(await prisma.ebook.findMany({ where: { is_published: true }, orderBy: [{ position: "asc" }, { created_at: "asc" }], select: publicSelect }));
});

// GET /api/ebooks/slug/:slug — detail publik
ebooksRouter.get("/slug/:slug", optionalAuth, async (req, res) => {
  const manage = canManage(req);
  const ebook = await prisma.ebook.findUnique({ where: { slug: req.params.slug }, ...(manage ? {} : { select: publicSelect }) });
  if (!ebook) return res.status(404).json({ error: "E-book tidak ditemukan" });
  if (!ebook.is_published && !manage) return res.status(404).json({ error: "E-book tidak ditemukan" });
  res.json(ebook);
});

// GET /api/ebooks/:id/download — unduhan ber-gate (butuh EbookGrant atau manager)
ebooksRouter.get("/:id/download", requireAuth, async (req, res) => {
  const ebook = await prisma.ebook.findUnique({ where: { id: req.params.id } });
  if (!ebook) return res.status(404).json({ error: "E-book tidak ditemukan" });
  const manage = req.user!.roles.some((r) => r === "admin" || r === "instructor");
  if (!manage) {
    const grant = await prisma.ebookGrant.findUnique({ where: { user_id_ebook_id: { user_id: req.user!.id, ebook_id: ebook.id } } });
    if (!grant) return res.status(403).json({ error: "Kamu belum memiliki e-book ini" });
  }
  if (!ebook.file_url) return res.status(404).json({ error: "File belum tersedia" });
  const filePath = path.join(PROTECTED_DIR, ebook.file_url);
  if (!existsSync(filePath)) return res.status(404).json({ error: "File tidak ditemukan" });
  res.download(filePath, `${ebook.slug}.pdf`);
});

// GET /api/ebooks/:id
ebooksRouter.get("/:id", optionalAuth, async (req, res) => {
  const manage = canManage(req);
  const ebook = await prisma.ebook.findUnique({ where: { id: req.params.id }, ...(manage ? {} : { select: publicSelect }) });
  if (!ebook) return res.status(404).json({ error: "E-book tidak ditemukan" });
  if (!ebook.is_published && !manage) return res.status(404).json({ error: "E-book tidak ditemukan" });
  res.json(ebook);
});

// POST /api/ebooks
ebooksRouter.post("/", ...requireManage, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    res.status(201).json(await prisma.ebook.create({ data: parsed.data }));
  } catch (e: any) {
    if (e?.code === "P2002") return res.status(409).json({ error: "Slug sudah dipakai" });
    throw e;
  }
});

// POST /api/ebooks/:id/file — unggah PDF e-book (privat)
ebooksRouter.post("/:id/file", ...requireManage, uploadEbookFile.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "File PDF wajib diunggah" });
  try {
    const ebook = await prisma.ebook.update({ where: { id: req.params.id }, data: { file_url: req.file.filename } });
    res.json(ebook);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "E-book tidak ditemukan" });
    throw e;
  }
});

// PATCH /api/ebooks/:id
ebooksRouter.patch("/:id", ...requireManage, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    res.json(await prisma.ebook.update({ where: { id: req.params.id }, data: parsed.data }));
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "E-book tidak ditemukan" });
    if (e?.code === "P2002") return res.status(409).json({ error: "Slug sudah dipakai" });
    throw e;
  }
});

// DELETE /api/ebooks/:id
ebooksRouter.delete("/:id", ...requireManage, async (req, res) => {
  try {
    await prisma.ebook.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "E-book tidak ditemukan" });
    throw e;
  }
});
