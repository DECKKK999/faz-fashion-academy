import { Router } from "express";
import { prisma } from "../db.js";
import { PAYMENT_INSTRUCTIONS } from "../config/payment.js";

export const paymentRouter = Router();

// GET /api/payment-info — rekening aktif (dari DB) & instruksi transfer
paymentRouter.get("/", async (_req, res) => {
  const accounts = await prisma.bankAccount.findMany({
    where: { is_active: true },
    orderBy: [{ position: "asc" }, { created_at: "asc" }],
    select: { bank: true, account_number: true, account_name: true },
  });
  res.json({ bank_accounts: accounts, instructions: PAYMENT_INSTRUCTIONS });
});
