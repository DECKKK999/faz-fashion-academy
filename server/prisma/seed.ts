import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_BANK_ACCOUNTS } from "../src/config/payment.js";
import { COURSE, MODULES, LESSON_COUNT, createCatalogCourse } from "./catalog.js";

const prisma = new PrismaClient();

// Default dev admin. Ganti kredensial ini di lingkungan nyata.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@faz.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "FAZ Admin";

async function seedAdmin() {
  const email = ADMIN_EMAIL.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    await prisma.userRole.upsert({
      where: { user_id_role: { user_id: existing.id, role: "admin" } },
      create: { user_id: existing.id, role: "admin" },
      update: {},
    });
    console.log(`Admin sudah ada (${email}) — role admin dipastikan.`);
    return;
  }

  const password_hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await prisma.user.create({
    data: {
      email,
      password_hash,
      profile: { create: { full_name: ADMIN_NAME } },
      roles: { create: [{ role: "admin" }, { role: "student" }] },
    },
  });

  console.log("==============================================");
  console.log("Admin default dibuat:");
  console.log(`  Email    : ${email}`);
  console.log(`  Password : ${ADMIN_PASSWORD}`);
  console.log("  GANTI password ini setelah login pertama.");
  console.log("==============================================");
}

// Idempotent: buat kursus katalog kalau belum ada. Tidak menghapus apa pun.
// Untuk mengosongkan katalog lama, gunakan reset-catalog.ts.
async function seedCourse() {
  const existing = await prisma.course.findUnique({ where: { slug: COURSE.slug } });
  if (existing) {
    console.log(`Kursus '${COURSE.slug}' sudah ada — dilewati.`);
    return;
  }
  await createCatalogCourse(prisma);
  console.log(`Kursus '${COURSE.title}' dibuat: ${MODULES.length} modul, ${LESSON_COUNT} pelajaran.`);
}

async function seedBankAccounts() {
  const count = await prisma.bankAccount.count();
  if (count > 0) {
    console.log(`Bank accounts sudah ada (${count}) — dilewati.`);
    return;
  }
  await prisma.bankAccount.createMany({
    data: DEFAULT_BANK_ACCOUNTS.map((b, i) => ({ ...b, position: i })),
  });
  console.log(`Bank accounts di-seed: ${DEFAULT_BANK_ACCOUNTS.length} (placeholder — ganti via Admin).`);
}

async function main() {
  await seedAdmin();
  await seedCourse();
  await seedBankAccounts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
