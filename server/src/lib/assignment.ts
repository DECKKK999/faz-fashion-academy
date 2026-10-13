import { open, unlink } from "node:fs/promises";
import path from "node:path";
import { prisma } from "../db.js";
import { PROTECTED_DIR } from "../upload.js";

/**
 * Status Tugas Akhir sebuah kelas untuk seorang user — padanan quizGate().
 * `required` hanya true bila tugasnya ada dan dipublikasikan; kelas tanpa tugas
 * tidak terpengaruh. Tugas dianggap lulus begitu peserta mengumpulkan file.
 */
export async function assignmentGate(userId: string, courseId: string) {
  const assignment = await prisma.assignment.findUnique({
    where: { course_id: courseId },
    select: { id: true, title: true, is_published: true },
  });

  if (!assignment || !assignment.is_published) {
    return { required: false, passed: true, assignment_id: assignment?.id ?? null, title: assignment?.title ?? null, submitted_at: null as Date | null };
  }

  const submission = await prisma.assignmentSubmission.findUnique({
    where: { assignment_id_user_id: { assignment_id: assignment.id, user_id: userId } },
    select: { submitted_at: true },
  });

  return {
    required: true,
    passed: !!submission,
    assignment_id: assignment.id,
    title: assignment.title,
    submitted_at: submission?.submitted_at ?? null,
  };
}

/** Lokasi absolut file pengumpulan; menolak nama yang mencoba keluar dari direktori privat. */
export function submissionFilePath(storedName: string): string {
  const resolved = path.resolve(PROTECTED_DIR, path.basename(storedName));
  if (path.dirname(resolved) !== path.resolve(PROTECTED_DIR)) throw new Error("Path file tidak valid");
  return resolved;
}

export async function removeSubmissionFile(storedName: string): Promise<void> {
  try {
    await unlink(submissionFilePath(storedName));
  } catch {
    /* sudah hilang / tidak bisa dihapus — jangan menggagalkan operasi utama */
  }
}

// Tanda tangan (magic bytes) awal file. MIME dari klien bisa dipalsukan, jadi isi file dicek lagi.
const SIGNATURES: Record<string, (b: Buffer) => boolean> = {
  "application/pdf": (b) => b.subarray(0, 4).toString("latin1") === "%PDF",
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b.subarray(0, 4).toString("latin1") === "RIFF" && b.subarray(8, 12).toString("latin1") === "WEBP",
};

export async function fileMatchesMime(filePath: string, mime: string): Promise<boolean> {
  const check = SIGNATURES[mime];
  if (!check) return false;
  const handle = await open(filePath, "r");
  try {
    const buf = Buffer.alloc(12);
    const { bytesRead } = await handle.read(buf, 0, 12, 0);
    return check(buf.subarray(0, bytesRead));
  } finally {
    await handle.close();
  }
}
