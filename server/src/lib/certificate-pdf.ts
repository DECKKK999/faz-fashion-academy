import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PDFDocument, rgb, degrees, type PDFFont, type PDFPage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type CertificatePdfData = {
  certificate_number: string;
  recipient_name: string;
  course_title: string;
  instructor_name: string | null;
  quiz_score?: number | null;
  issued_at: Date;
  revoked: boolean;
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = join(__dirname, "../../src/assets/certificate-template.pdf");
const FONT_REGULAR_PATH = join(__dirname, "../../src/assets/fonts/Inter-Regular.ttf");
const FONT_BOLD_PATH = join(__dirname, "../../src/assets/fonts/Inter-Bold.ttf");

// Posisi & ukuran dua field dinamis, diambil persis dari template asli
// (server/src/assets/certificate-template.pdf) via ekstraksi teks PDF —
// JANGAN diubah tanpa mengecek ulang templatenya, karena semua elemen lain
// (pita, lencana, tanda tangan, tag) dibiarkan apa adanya dari file itu.
const NAME = { x: 87.33, y: 410.15, size: 16, color: rgb(0.07, 0.07, 0.07) };
const NAME_MASK = { x: 83, y: 404, width: 106, height: 26 }; // s/d sebelum " berhasil lulus kelas"
const NAME_MAX_WIDTH = 100; // biar nggak nabrak teks berikutnya kalau nama panjang

const CERT_ID = { x: 739.32, y: 577.5, size: 13, color: rgb(0.55, 0.55, 0.55), rotate: -90 };
const CERT_ID_MASK = { x: 736, y: 573.5, width: 243, height: 18, rotate: -90 };

// "Date of issue" value ("Jakarta, 22 Juli 2026" di template asli) — posisi
// juga diambil dari ekstraksi teks PDF, sama seperti NAME/CERT_ID di atas.
const DATE = { x: 254.13, y: 55.18, size: 12, color: rgb(0.07, 0.07, 0.07) };
const DATE_MASK = { x: 250, y: 51, width: 190, height: 16 };
const DATE_MAX_WIDTH = 180;

function fitFontSize(font: PDFFont, text: string, maxWidth: number, startSize: number): number {
  let size = startSize;
  while (size > 8 && font.widthOfTextAtSize(text, size) > maxWidth) size -= 0.5;
  return size;
}

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
function formatIssuedDateLabel(d: Date): string {
  return `Jakarta, ${d.getDate()} ${MONTHS_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Mengisi sertifikat FAZ Academy dari template PDF asli (dibuat di luar
 * sistem, lihat certificate-template.pdf) — hanya tiga field yang diganti:
 * nama penerima, nomor sertifikat, dan tanggal terbit. Elemen lain (pita,
 * lencana, tanda tangan, tag) dipakai persis seperti di file aslinya.
 */
export async function generateCertificatePdf(
  data: CertificatePdfData,
  stream: NodeJS.WritableStream,
): Promise<void> {
  const templateBytes = readFileSync(TEMPLATE_PATH);
  const pdfDoc = await PDFDocument.load(templateBytes);
  pdfDoc.registerFontkit(fontkit);

  const [fontRegular, fontBold] = await Promise.all([
    pdfDoc.embedFont(readFileSync(FONT_REGULAR_PATH)),
    pdfDoc.embedFont(readFileSync(FONT_BOLD_PATH)),
  ]);

  const page: PDFPage = pdfDoc.getPages()[0];

  // ---- Nama penerima ----
  page.drawRectangle({ x: NAME_MASK.x, y: NAME_MASK.y, width: NAME_MASK.width, height: NAME_MASK.height, color: rgb(1, 1, 1) });
  const nameSize = fitFontSize(fontBold, data.recipient_name, NAME_MAX_WIDTH, NAME.size);
  page.drawText(data.recipient_name, { x: NAME.x, y: NAME.y, size: nameSize, font: fontBold, color: NAME.color });

  // ---- Nomor sertifikat (vertikal, sepanjang tepi kanan) ----
  page.drawRectangle({
    x: CERT_ID_MASK.x,
    y: CERT_ID_MASK.y,
    width: CERT_ID_MASK.width,
    height: CERT_ID_MASK.height,
    color: rgb(1, 1, 1),
    rotate: degrees(CERT_ID_MASK.rotate),
  });
  page.drawText(`Certificate ID: ${data.certificate_number}`, {
    x: CERT_ID.x,
    y: CERT_ID.y,
    size: CERT_ID.size,
    font: fontRegular,
    color: CERT_ID.color,
    rotate: degrees(CERT_ID.rotate),
  });

  // ---- Tanggal terbit ----
  page.drawRectangle({ x: DATE_MASK.x, y: DATE_MASK.y, width: DATE_MASK.width, height: DATE_MASK.height, color: rgb(1, 1, 1) });
  const dateLabel = formatIssuedDateLabel(data.issued_at);
  const dateSize = fitFontSize(fontBold, dateLabel, DATE_MAX_WIDTH, DATE.size);
  page.drawText(dateLabel, { x: DATE.x, y: DATE.y, size: dateSize, font: fontBold, color: DATE.color });

  // Watermark "DICABUT" bila sertifikat dicabut admin — satu-satunya elemen
  // tambahan di luar template, dan hanya muncul untuk kasus revoke.
  if (data.revoked) {
    const { width, height } = page.getSize();
    page.drawText("DICABUT", {
      x: width / 2 - 260,
      y: height / 2 - 40,
      size: 100,
      font: fontBold,
      color: rgb(0.85, 0.29, 0.29),
      opacity: 0.35,
      rotate: degrees(-25),
    });
  }

  const pdfBytes = await pdfDoc.save();
  stream.end(Buffer.from(pdfBytes));
}
