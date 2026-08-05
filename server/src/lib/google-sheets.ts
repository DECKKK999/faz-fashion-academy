import { auth, sheets, type sheets_v4 } from "@googleapis/sheets";
import { env, googleSheetsConfigured } from "../env.js";

// Kolom di tab sertifikat (sama untuk kedua sumber file yang dulu diimpor:
// "100_certificate_codes_...xlsx" dan "Certifikate Code.xlsm"), ditambah
// No HP & Email yang diisi otomatis sejak sertifikat mulai menyimpan kontak peserta.
//   A: No.  B: Nama Peserta  C: Certificate ID  D: Nama Kelas  E: Nama Mentor  F: Tanggal  G: No HP  H: Email
const HEADER_ROW = 1;
const FIRST_DATA_ROW = 2;
const COL = {
  no: "A",
  recipient: "B",
  code: "C",
  courseTitle: "D",
  instructor: "E",
  issuedAt: "F",
  phone: "G",
  email: "H",
};

export type SheetCertificateRow = {
  rowNumber: number; // baris asli di sheet (1-based, termasuk header)
  no: string;
  recipientName: string | null;
  code: string;
  courseTitle: string;
  instructorName: string | null;
  issuedAtRaw: string | null; // string tanggal apa adanya dari sheet
  recipientPhone: string | null;
  recipientEmail: string | null;
};

let cachedClient: sheets_v4.Sheets | null = null;

function getClient(): sheets_v4.Sheets {
  if (cachedClient) return cachedClient;
  if (!googleSheetsConfigured) {
    throw new Error("Google Sheets belum dikonfigurasi (GOOGLE_SERVICE_ACCOUNT_JSON / CERTIFICATE_SHEET_ID kosong)");
  }
  const credentials = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON);
  const googleAuth = new auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  cachedClient = sheets({ version: "v4", auth: googleAuth });
  return cachedClient;
}

const tabRange = (range: string) => `'${env.CERTIFICATE_SHEET_TAB}'!${range}`;

/** Baca semua baris data (tanpa header) dari sheet. */
export async function fetchAllCertificateRows(): Promise<SheetCertificateRow[]> {
  const sheets = getClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: env.CERTIFICATE_SHEET_ID,
    range: tabRange(`A${FIRST_DATA_ROW}:H`),
  });
  const rows = res.data.values ?? [];
  return rows
    .map((row, i) => ({
      rowNumber: FIRST_DATA_ROW + i,
      no: row[0] ?? "",
      recipientName: (row[1] ?? "").toString().trim() || null,
      code: (row[2] ?? "").toString().trim(),
      courseTitle: row[3] ?? "",
      instructorName: (row[4] ?? "").toString().trim() || null,
      issuedAtRaw: (row[5] ?? "").toString().trim() || null,
      recipientPhone: (row[6] ?? "").toString().trim() || null,
      recipientEmail: (row[7] ?? "").toString().trim() || null,
    }))
    .filter((r) => r.code);
}

/**
 * Isi nama + tanggal untuk kode yang sudah ada di sheet, atau tambah baris
 * baru kalau kodenya belum ada (kasus pool 100 kode awal sudah habis dan
 * sistem generate kode baru sendiri).
 */
export async function upsertCertificateRowInSheet(row: {
  code: string;
  recipientName: string;
  courseTitle: string;
  instructorName: string | null;
  issuedAtLabel: string; // sudah diformat, mis. "22 Juli 2026"
  recipientPhone: string | null;
  recipientEmail: string | null;
}): Promise<void> {
  const sheets = getClient();
  const existing = await fetchAllCertificateRows();
  const match = existing.find((r) => r.code === row.code);

  if (match) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.CERTIFICATE_SHEET_ID,
      range: tabRange(`${COL.recipient}${match.rowNumber}:${COL.recipient}${match.rowNumber}`),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[row.recipientName]] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.CERTIFICATE_SHEET_ID,
      range: tabRange(`${COL.issuedAt}${match.rowNumber}:${COL.issuedAt}${match.rowNumber}`),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[row.issuedAtLabel]] },
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: env.CERTIFICATE_SHEET_ID,
      range: tabRange(`${COL.phone}${match.rowNumber}:${COL.email}${match.rowNumber}`),
      valueInputOption: "USER_ENTERED",
      requestBody: { values: [[row.recipientPhone ?? "", row.recipientEmail ?? ""]] },
    });
    return;
  }

  // Kode baru (dibuat otomatis setelah 100 kode awal habis) — tambah baris.
  const nextNo = existing.length > 0 ? Math.max(...existing.map((r) => Number(r.no) || 0)) + 1 : 1;
  await sheets.spreadsheets.values.append({
    spreadsheetId: env.CERTIFICATE_SHEET_ID,
    range: tabRange(`A${HEADER_ROW}:H${HEADER_ROW}`),
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [
        [
          nextNo,
          row.recipientName,
          row.code,
          row.courseTitle,
          row.instructorName ?? "",
          row.issuedAtLabel,
          row.recipientPhone ?? "",
          row.recipientEmail ?? "",
        ],
      ],
    },
  });
}
