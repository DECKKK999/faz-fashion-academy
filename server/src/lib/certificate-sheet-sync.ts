import { prisma } from "../db.js";
import { googleSheetsConfigured } from "../env.js";
import { fetchAllCertificateRows, upsertCertificateRowInSheet } from "./google-sheets.js";

function formatIssuedAtLabel(d: Date): string {
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function parseSheetDate(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

/**
 * Tarik semua baris dari Google Sheets ke tabel certificate_codes (dipakai
 * kalau ada yang mengedit sheet secara manual, bukan lewat penerbitan
 * sertifikat otomatis). Aman dipanggil berkala — upsert berdasarkan `code`.
 */
export async function pullCertificateCodesFromSheet(): Promise<{ synced: number } | null> {
  if (!googleSheetsConfigured) return null;
  const rows = await fetchAllCertificateRows();

  const existingRows = await prisma.certificateCode.findMany({
    where: { code: { in: rows.map((r) => r.code) } },
    select: { code: true, recipient_name: true, sheet_synced_at: true },
  });
  const existingByCode = new Map(existingRows.map((r) => [r.code, r]));

  let synced = 0;
  for (const row of rows) {
    const existing = existingByCode.get(row.code);
    // Baris ini baru saja diklaim/dibuat lokal dan belum sempat di-push ke
    // sheet (sheet_synced_at null) — kalau sheet masih kosong untuk baris ini,
    // jangan disentuh, supaya push berikutnya yang menang, bukan pull ini
    // yang menandainya "sudah sinkron" padahal sheet belum ketulisan.
    if (existing?.recipient_name && !existing.sheet_synced_at && !row.recipientName) {
      continue;
    }

    await prisma.certificateCode.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        course_title: row.courseTitle,
        instructor_name: row.instructorName,
        recipient_name: row.recipientName,
        recipient_phone: row.recipientPhone,
        recipient_email: row.recipientEmail,
        issued_at: parseSheetDate(row.issuedAtRaw),
        sheet_synced_at: new Date(),
      },
      update: {
        // Nama/tanggal di sheet menang kalau baris ini belum pernah kita
        // tulis balik sendiri (mis. diedit manual) — tapi jangan timpa baris
        // yang baru saja kita klaim dan belum sempat di-push (sheet_synced_at
        // null berarti "milik kita, sheet belum tahu"), biar nggak bentrok.
        course_title: row.courseTitle,
        instructor_name: row.instructorName,
        ...(row.recipientName
          ? {
              recipient_name: row.recipientName,
              recipient_phone: row.recipientPhone,
              recipient_email: row.recipientEmail,
              issued_at: parseSheetDate(row.issuedAtRaw),
            }
          : {}),
        sheet_synced_at: new Date(),
      },
    });
    synced++;
  }
  return { synced };
}

/**
 * Push balik baris yang barusan diklaim/dibuat sistem (recipient_name terisi
 * tapi belum pernah berhasil ditulis ke sheet) — dipanggil setelah
 * penerbitan sertifikat, dan juga secara berkala sebagai retry kalau push
 * langsungnya sempat gagal (mis. Google API lagi down).
 */
export async function pushPendingCertificateCodesToSheet(): Promise<{ pushed: number; failed: number } | null> {
  if (!googleSheetsConfigured) return null;
  const pending = await prisma.certificateCode.findMany({
    where: { recipient_name: { not: null }, sheet_synced_at: null },
    orderBy: { updated_at: "asc" },
    take: 25, // batasi per-jalan biar nggak kena rate limit kalau numpuk banyak
  });

  let pushed = 0;
  let failed = 0;
  for (const row of pending) {
    try {
      await upsertCertificateRowInSheet({
        code: row.code,
        recipientName: row.recipient_name!,
        courseTitle: row.course_title,
        instructorName: row.instructor_name,
        issuedAtLabel: formatIssuedAtLabel(row.issued_at ?? new Date()),
        recipientPhone: row.recipient_phone,
        recipientEmail: row.recipient_email,
      });
      await prisma.certificateCode.update({ where: { id: row.id }, data: { sheet_synced_at: new Date() } });
      pushed++;
    } catch (e) {
      failed++;
      console.error(`[certificate-sheet-sync] Gagal push kode ${row.code} ke sheet:`, e);
    }
  }
  return { pushed, failed };
}
