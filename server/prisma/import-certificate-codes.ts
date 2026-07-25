// One-off importer: loads certificate-codes-seed.json (exported from the
// "Certifikate Code" roster spreadsheet) into the certificate_codes table.
// Safe to re-run — upserts by unique `code`, so it can be used to pull in
// newly-issued rows (updated recipient_name/issued_at) without duplicating.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));

type SeedRow = {
  code: string;
  course_title: string;
  instructor_name: string | null;
  recipient_name: string | null;
  issued_at: string | null;
};

async function main() {
  const rows: SeedRow[] = JSON.parse(
    readFileSync(join(__dirname, "certificate-codes-seed.json"), "utf-8"),
  );

  let created = 0;
  let updated = 0;
  for (const row of rows) {
    const existing = await prisma.certificateCode.findUnique({ where: { code: row.code } });
    await prisma.certificateCode.upsert({
      where: { code: row.code },
      create: {
        code: row.code,
        course_title: row.course_title,
        instructor_name: row.instructor_name,
        recipient_name: row.recipient_name,
        issued_at: row.issued_at ? new Date(row.issued_at) : null,
      },
      update: {
        course_title: row.course_title,
        instructor_name: row.instructor_name,
        recipient_name: row.recipient_name,
        issued_at: row.issued_at ? new Date(row.issued_at) : null,
      },
    });
    if (existing) updated++;
    else created++;
  }

  console.log(`Import selesai. Dibuat: ${created}, diperbarui: ${updated}, total: ${rows.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
