import { randomBytes } from "node:crypto";
import type { Prisma } from "@prisma/client";

// Alfabet & format sama persis dengan 100 kode awal yang diimpor dari sheet:
// MPB-<2 digit tahun>-<4 char>-<4 char>, karakter dari 0-9A-Z.
const CODE_ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomSegment(length = 4): string {
  const bytes = randomBytes(length);
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join("");
}

function generateCandidateCode(): string {
  const year = new Date().getFullYear().toString().slice(-2);
  return `MPB-${year}-${randomSegment()}-${randomSegment()}`;
}

type TxClient = Prisma.TransactionClient;

/**
 * Klaim satu baris certificate_codes yang belum terisi (recipient_name IS
 * NULL), dengan FOR UPDATE SKIP LOCKED biar aman kalau dua penerbitan
 * sertifikat terjadi bersamaan. Kalau 100 kode awal sudah habis, generate
 * kode baru dengan format yang sama dan simpan sebagai baris baru.
 *
 * HARUS dipanggil di dalam prisma.$transaction — mengembalikan kode yang
 * SUDAH diisi recipient_name + issued_at di baris itu.
 */
export async function claimCertificateCode(
  tx: TxClient,
  data: {
    recipientName: string;
    courseTitle: string;
    instructorName: string | null;
    recipientEmail: string | null;
    recipientPhone: string | null;
  },
): Promise<{ code: string; isNewCode: boolean }> {
  const locked = await tx.$queryRaw<{ id: string; code: string }[]>`
    SELECT id, code FROM certificate_codes
    WHERE recipient_name IS NULL
    ORDER BY code ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  `;

  if (locked.length > 0) {
    const { id, code } = locked[0];
    await tx.certificateCode.update({
      where: { id },
      data: {
        recipient_name: data.recipientName,
        recipient_email: data.recipientEmail,
        recipient_phone: data.recipientPhone,
        issued_at: new Date(),
        sheet_synced_at: null,
      },
    });
    return { code, isNewCode: false };
  }

  // Pool 100 kode awal habis — generate kode baru dengan format yang sama.
  let code = generateCandidateCode();
  for (let attempt = 0; attempt < 20; attempt++) {
    const exists = await tx.certificateCode.findUnique({ where: { code }, select: { id: true } });
    if (!exists) break;
    code = generateCandidateCode();
  }

  await tx.certificateCode.create({
    data: {
      code,
      course_title: data.courseTitle,
      instructor_name: data.instructorName,
      recipient_name: data.recipientName,
      recipient_email: data.recipientEmail,
      recipient_phone: data.recipientPhone,
      issued_at: new Date(),
      sheet_synced_at: null,
    },
  });
  return { code, isNewCode: true };
}
