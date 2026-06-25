import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { env } from "../env.js";

export type CertificatePdfData = {
  certificate_number: string;
  recipient_name: string;
  course_title: string;
  instructor_name: string | null;
  issued_at: Date;
  revoked: boolean;
};

const COLOR = {
  ink: "#1a1a1a",
  muted: "#6b6b6b",
  faint: "#9a9a9a",
  accent: "#b08d57", // muted gold
  border: "#c9c9c9",
  watermark: "#d94b4b",
};

function formatIssuedAt(d: Date): string {
  // e.g. "25 Juni 2026" (Indonesian month names)
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Builds a landscape A4 certificate PDF and pipes it into the given writable
 * stream (typically the Express response). Embeds a QR code linking to the
 * public verification page. Draws a REVOKED watermark when revoked.
 */
export async function generateCertificatePdf(
  data: CertificatePdfData,
  stream: NodeJS.WritableStream,
): Promise<void> {
  const verifyUrl = `${env.APP_BASE_URL}/verifikasi/${encodeURIComponent(data.certificate_number)}`;

  // Generate QR as a PNG data URL up-front (qrcode is async).
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
    margin: 0,
    width: 220,
    color: { dark: COLOR.ink, light: "#ffffff" },
  });
  const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 48, bottom: 48, left: 56, right: 56 },
    info: {
      Title: `Sertifikat ${data.certificate_number}`,
      Author: "FAZ Academy",
      Subject: data.course_title,
    },
  });

  doc.pipe(stream);

  const pageW = doc.page.width;
  const pageH = doc.page.height;
  const m = 40; // outer frame inset

  // Outer + inner decorative frame.
  doc
    .lineWidth(2)
    .strokeColor(COLOR.ink)
    .rect(m, m, pageW - m * 2, pageH - m * 2)
    .stroke();
  doc
    .lineWidth(0.75)
    .strokeColor(COLOR.accent)
    .rect(m + 8, m + 8, pageW - (m + 8) * 2, pageH - (m + 8) * 2)
    .stroke();

  const contentW = pageW - m * 2 - 32;
  const left = m + 16;
  const centerOpts = { width: contentW, align: "center" as const };

  // Brand / wordmark
  doc
    .fillColor(COLOR.ink)
    .font("Helvetica-Bold")
    .fontSize(13)
    .text("FAZ ACADEMY", left, m + 36, { ...centerOpts, characterSpacing: 6 });
  doc
    .fillColor(COLOR.faint)
    .font("Helvetica")
    .fontSize(8)
    .text("FASHION A-Z ACADEMY INDONESIA", left, doc.y + 2, { ...centerOpts, characterSpacing: 3 });

  // Title
  doc
    .fillColor(COLOR.ink)
    .font("Helvetica")
    .fontSize(30)
    .text("Sertifikat Penyelesaian", left, m + 96, centerOpts);

  // Divider rule
  const ruleY = doc.y + 14;
  doc
    .lineWidth(0.75)
    .strokeColor(COLOR.border)
    .moveTo(pageW / 2 - 90, ruleY)
    .lineTo(pageW / 2 + 90, ruleY)
    .stroke();

  // "Diberikan kepada"
  doc
    .fillColor(COLOR.muted)
    .font("Helvetica")
    .fontSize(11)
    .text("Diberikan kepada", left, ruleY + 22, { ...centerOpts, characterSpacing: 2 });

  // Recipient name
  doc
    .fillColor(COLOR.ink)
    .font("Helvetica-Bold")
    .fontSize(34)
    .text(data.recipient_name, left, doc.y + 8, centerOpts);

  // "atas penyelesaian kelas"
  doc
    .fillColor(COLOR.muted)
    .font("Helvetica")
    .fontSize(11)
    .text("atas keberhasilan menyelesaikan kelas", left, doc.y + 12, centerOpts);

  // Course title
  doc
    .fillColor(COLOR.accent)
    .font("Helvetica-Oblique")
    .fontSize(20)
    .text(data.course_title, left, doc.y + 8, centerOpts);

  // ===== Footer row: instructor (left), QR (center), date + number (right) =====
  const footerY = pageH - m - 150;
  const colW = contentW / 3;

  // Instructor (left column)
  doc
    .fillColor(COLOR.faint)
    .font("Helvetica")
    .fontSize(8)
    .text("INSTRUKTUR", left, footerY + 60, { width: colW, align: "center", characterSpacing: 2 });
  doc
    .lineWidth(0.5)
    .strokeColor(COLOR.border)
    .moveTo(left + 20, footerY + 56)
    .lineTo(left + colW - 20, footerY + 56)
    .stroke();
  doc
    .fillColor(COLOR.ink)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(data.instructor_name || "FAZ Academy", left, footerY + 38, { width: colW, align: "center" });

  // QR (center column)
  const qrSize = 96;
  const qrX = left + colW + (colW - qrSize) / 2;
  doc.image(qrBuffer, qrX, footerY + 8, { width: qrSize, height: qrSize });
  doc
    .fillColor(COLOR.faint)
    .font("Helvetica")
    .fontSize(7)
    .text("Pindai untuk verifikasi keaslian", left + colW, footerY + 8 + qrSize + 4, {
      width: colW,
      align: "center",
      characterSpacing: 1,
    });

  // Date + certificate number (right column)
  const rightX = left + colW * 2;
  doc
    .fillColor(COLOR.faint)
    .font("Helvetica")
    .fontSize(8)
    .text("DITERBITKAN", rightX, footerY + 60, { width: colW, align: "center", characterSpacing: 2 });
  doc
    .lineWidth(0.5)
    .strokeColor(COLOR.border)
    .moveTo(rightX + 20, footerY + 56)
    .lineTo(rightX + colW - 20, footerY + 56)
    .stroke();
  doc
    .fillColor(COLOR.ink)
    .font("Helvetica-Bold")
    .fontSize(12)
    .text(formatIssuedAt(data.issued_at), rightX, footerY + 38, { width: colW, align: "center" });

  // Certificate number — centered bottom strip
  doc
    .fillColor(COLOR.muted)
    .font("Helvetica")
    .fontSize(9)
    .text(`No. Sertifikat: ${data.certificate_number}`, left, pageH - m - 30, {
      width: contentW,
      align: "center",
      characterSpacing: 1,
    });

  // REVOKED watermark (drawn last so it overlays everything).
  if (data.revoked) {
    doc.save();
    doc.rotate(-30, { origin: [pageW / 2, pageH / 2] });
    doc
      .fillColor(COLOR.watermark)
      .opacity(0.28)
      .font("Helvetica-Bold")
      .fontSize(120)
      .text("DICABUT", pageW / 2 - 360, pageH / 2 - 70, {
        width: 720,
        align: "center",
        characterSpacing: 8,
      });
    doc.opacity(1).restore();
  }

  doc.end();
}
