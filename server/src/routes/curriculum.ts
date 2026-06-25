import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db.js";
import { requireManage } from "../auth.js";

// Routes for modules and lessons keyed by their own id.
export const modulesRouter = Router();
export const lessonsRouter = Router();

const moduleUpdateSchema = z.object({
  title: z.string().optional(),
  position: z.number().int().optional(),
});

modulesRouter.patch("/:id", ...requireManage, async (req, res) => {
  const parsed = moduleUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const module = await prisma.module.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(module);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Module tidak ditemukan" });
    throw e;
  }
});

modulesRouter.delete("/:id", ...requireManage, async (req, res) => {
  try {
    await prisma.module.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Module tidak ditemukan" });
    throw e;
  }
});

// POST /api/modules/:moduleId/lessons
modulesRouter.post("/:moduleId/lessons", ...requireManage, async (req, res) => {
  const schema = z.object({
    title: z.string().min(1).default("New Lesson"),
    position: z.number().int().default(0),
  });
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  const lesson = await prisma.lesson.create({
    data: { module_id: req.params.moduleId, ...parsed.data },
  });
  res.status(201).json(lesson);
});

const lessonUpdateSchema = z.object({
  title: z.string().optional(),
  content: z.string().nullable().optional(),
  video_url: z.string().nullable().optional(),
  duration_minutes: z.number().int().nullable().optional(),
  is_free_preview: z.boolean().optional(),
  position: z.number().int().optional(),
});

lessonsRouter.patch("/:id", ...requireManage, async (req, res) => {
  const parsed = lessonUpdateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.errors[0]?.message });
  try {
    const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data: parsed.data });
    res.json(lesson);
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Lesson tidak ditemukan" });
    throw e;
  }
});

lessonsRouter.delete("/:id", ...requireManage, async (req, res) => {
  try {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.json({ ok: true });
  } catch (e: any) {
    if (e?.code === "P2025") return res.status(404).json({ error: "Lesson tidak ditemukan" });
    throw e;
  }
});
