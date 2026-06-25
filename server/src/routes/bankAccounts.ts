import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireAdmin } from "../auth.js";

export const bankAccountsRouter = Router();

const createSchema = z.object({
  bank: z.string().trim().min(1, "Nama bank wajib diisi"),
  account_number: z.string().trim().min(1, "Nomor rekening wajib diisi"),
  account_name: z.string().trim().min(1, "Nama pemilik wajib diisi"),
  is_active: z.boolean().optional(),
  position: z.number().int().optional(),
});

const updateSchema = createSchema.partial();

// GET /api/admin/bank-accounts — semua rekening (termasuk nonaktif)
bankAccountsRouter.get("/", ...requireAdmin, async (_req, res) => {
  const accounts = await prisma.bankAccount.findMany({
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
  });
  res.json(accounts);
});

// POST /api/admin/bank-accounts
bankAccountsRouter.post("/", ...requireAdmin, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  const account = await prisma.bankAccount.create({ data: parsed.data });
  res.status(201).json(account);
});

// PATCH /api/admin/bank-accounts/:id
bankAccountsRouter.patch("/:id", ...requireAdmin, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const account = await prisma.bankAccount.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(account);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Rekening tidak ditemukan" });
    throw e;
  }
});

// DELETE /api/admin/bank-accounts/:id
bankAccountsRouter.delete("/:id", ...requireAdmin, async (req, res) => {
  try {
    await prisma.bankAccount.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Rekening tidak ditemukan" });
    throw e;
  }
});
