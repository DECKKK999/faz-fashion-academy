import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Usage:
//   npm run create-admin -- <email> [password] ["Full Name"]
// Jika user sudah ada, hanya menambahkan role admin.
async function main() {
  const [email, password, name] = process.argv.slice(2);
  if (!email) {
    console.error('Usage: npm run create-admin -- <email> [password] ["Full Name"]');
    process.exit(1);
  }
  const lower = email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: lower } });

  if (existing) {
    await prisma.userRole.upsert({
      where: { user_id_role: { user_id: existing.id, role: "admin" } },
      create: { user_id: existing.id, role: "admin" },
      update: {},
    });
    console.log(`User ${lower} dijadikan admin.`);
    return;
  }

  if (!password) {
    console.error("User belum ada. Sertakan password untuk membuat akun admin baru.");
    process.exit(1);
  }
  const password_hash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: {
      email: lower,
      password_hash,
      profile: { create: { full_name: name ?? "" } },
      roles: { create: [{ role: "admin" }, { role: "student" }] },
    },
  });
  console.log(`Admin baru dibuat: ${lower}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
