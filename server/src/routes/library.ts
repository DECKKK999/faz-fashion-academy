import { Router } from "express";
import { prisma } from "../db.js";
import { requireAuth } from "../auth.js";

export const libraryRouter = Router();

const ebookSelect = { id: true, slug: true, title: true, cover_image_url: true, author: true };
const eventSelect = { id: true, slug: true, title: true, cover_image_url: true, date_label: true, location: true };

// GET /api/library — entitlement digital milik user (e-book + tiket event)
libraryRouter.get("/", requireAuth, async (req, res) => {
  const userId = req.user!.id;

  const [ebooks, tickets] = await Promise.all([
    prisma.ebookGrant.findMany({
      where: { user_id: userId },
      include: { ebook: { select: ebookSelect } },
      orderBy: { granted_at: "desc" },
    }),
    prisma.eventTicket.findMany({
      where: { user_id: userId },
      include: { event: { select: eventSelect } },
      orderBy: { issued_at: "desc" },
    }),
  ]);

  res.json({ ebooks, tickets });
});
