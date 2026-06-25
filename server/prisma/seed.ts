import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_BANK_ACCOUNTS } from "../src/config/payment.js";

const prisma = new PrismaClient();

// Default dev admin. Ganti kredensial ini di lingkungan nyata.
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@faz.test";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "admin123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? "FAZ Admin";

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

// ---- Courses (sebelumnya hardcoded di Kelas.tsx / CoursesSection.tsx) ----
const courses = [
  { title: "Desain Busana Dasar", category: "Desain", level: "Pemula", price_idr: 299000, duration_minutes: 720, students_count: 1200, rating: 4.9, description: "Pelajari fondasi desain busana dari sketsa hingga prototipe.", cover_image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=700&h=500&fit=crop" },
  { title: "Fashion Marketing Digital", category: "Marketing", level: "Menengah", price_idr: 399000, duration_minutes: 480, students_count: 890, rating: 4.8, description: "Strategi pemasaran digital khusus industri fashion.", cover_image_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&h=500&fit=crop" },
  { title: "Pattern Making & Draping", category: "Teknik", level: "Lanjutan", price_idr: 499000, duration_minutes: 960, students_count: 650, rating: 4.9, description: "Teknik pembuatan pola dan draping profesional.", cover_image_url: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=700&h=500&fit=crop" },
  { title: "Fashion Illustration", category: "Desain", level: "Pemula", price_idr: 349000, duration_minutes: 600, students_count: 1500, rating: 4.7, description: "Kuasai ilustrasi fashion dari sketsa hingga rendering digital.", cover_image_url: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=700&h=500&fit=crop" },
  { title: "Branding Fashion", category: "Bisnis", level: "Menengah", price_idr: 450000, duration_minutes: 840, students_count: 780, rating: 4.8, description: "Bangun identitas brand fashion yang kuat dan berkesan.", cover_image_url: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=700&h=500&fit=crop" },
  { title: "Personal Styling", category: "Styling", level: "Pemula", price_idr: 275000, duration_minutes: 360, students_count: 2100, rating: 4.9, description: "Seni padu padan dan personal styling untuk segala bentuk tubuh.", cover_image_url: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=700&h=500&fit=crop" },
  { title: "Sustainable Fashion", category: "Bisnis", level: "Menengah", price_idr: 350000, duration_minutes: 480, students_count: 520, rating: 4.6, description: "Membangun bisnis fashion yang berkelanjutan dan etis.", cover_image_url: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=700&h=500&fit=crop" },
  { title: "Fashion Photography", category: "Marketing", level: "Menengah", price_idr: 425000, duration_minutes: 720, students_count: 940, rating: 4.8, description: "Teknik fotografi produk dan editorial untuk fashion.", cover_image_url: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=700&h=500&fit=crop" },
];

// ---- E-books (sebelumnya hardcoded di Ebook.tsx) ----
const ebooks = [
  { title: "The Art of Pattern Making", author: "Rina Setiawan", category: "Teknik", price_idr: 89000, pages: 142, description: "Panduan lengkap teknik pembuatan pola dari dasar hingga mahir.", cover_image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=800&fit=crop" },
  { title: "Fashion Illustration Masterclass", author: "Dian Pratama", category: "Ilustrasi", price_idr: 129000, pages: 210, description: "Kuasai seni ilustrasi fashion dari sketsa hingga rendering digital.", cover_image_url: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=800&fit=crop" },
  { title: "Sustainable Fashion Guide", author: "Maya Anggraini", category: "Sustainability", price_idr: 79000, pages: 98, description: "Membangun brand fashion yang berkelanjutan dan ramah lingkungan.", cover_image_url: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=800&fit=crop" },
  { title: "Textile & Material Science", author: "Andi Wibowo", category: "Material", price_idr: 149000, pages: 186, description: "Ilmu tekstil dan material untuk desainer fashion profesional.", cover_image_url: "https://images.unsplash.com/photo-1553729459-ade2d1e6b8a0?w=600&h=800&fit=crop" },
  { title: "Fashion Business Blueprint", author: "Sarah Kartika", category: "Bisnis", price_idr: 99000, pages: 164, description: "Strategi membangun bisnis fashion dari nol hingga sukses.", cover_image_url: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=800&fit=crop" },
  { title: "Color Theory for Fashion", author: "Budi Hartono", category: "Desain", price_idr: 69000, pages: 112, description: "Teori warna dan aplikasinya dalam desain busana kontemporer.", cover_image_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=800&fit=crop" },
  { title: "Draping Fundamentals", author: "Lina Kusuma", category: "Teknik", price_idr: 119000, pages: 156, description: "Teknik draping klasik dan modern untuk busana haute couture.", cover_image_url: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=800&fit=crop" },
  { title: "Fashion Branding Essentials", author: "Reza Firmansyah", category: "Bisnis", price_idr: 109000, pages: 134, description: "Membangun identitas brand fashion yang kuat dan berkesan.", cover_image_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop" },
];

// ---- Events (sebelumnya hardcoded di Event.tsx) ----
const events = [
  { title: "Pattern Making Workshop: Kebaya Modern", category: "Workshop", date_label: "26 April 2026", time_label: "10:00 — 16:00 WIB", location: "FAZ Studio, Jakarta Selatan", address: "Jl. Kemang Raya No. 12, Jakarta 12730", price_idr: 350000, is_free: false, spots: 20, spots_left: 7, speaker: "Rina Setiawan", description: "Workshop intensif satu hari mempelajari teknik pembuatan pola kebaya modern. Peserta akan belajar dari dasar hingga menghasilkan pola siap potong untuk kebaya kontemporer.", highlights: ["Material & alat disediakan", "Sertifikat kehadiran", "Makan siang included", "Take-home pattern kit"], cover_image_url: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop" },
  { title: "Sustainable Fashion Talk: Masa Depan Tekstil Indonesia", category: "Talkshow", date_label: "3 Mei 2026", time_label: "14:00 — 17:00 WIB", location: "Online via Zoom", address: "Link akan dikirim via email H-1", price_idr: 0, is_free: true, spots: 200, spots_left: 84, speaker: "Dr. Ayu Larasati & Made Surya", description: "Diskusi mendalam tentang masa depan industri tekstil Indonesia yang berkelanjutan. Menampilkan perspektif dari akademisi dan praktisi dalam menghadapi tantangan fast fashion.", highlights: ["Gratis & terbuka untuk umum", "Sesi tanya jawab interaktif", "E-certificate", "Recording tersedia 7 hari"], cover_image_url: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop" },
  { title: "Batik Contemporary: From Heritage to High Fashion", category: "Exhibition", date_label: "10 — 15 Mei 2026", time_label: "10:00 — 20:00 WIB", location: "Museum Tekstil Jakarta", address: "Jl. Aipda KS Tubun No.2-4, Tanah Abang, Jakarta", price_idr: 50000, is_free: false, spots: 500, spots_left: 312, speaker: "Kurator: Dian Pratama", description: "Pameran yang menampilkan evolusi batik dari warisan budaya menjadi elemen high fashion kontemporer. Menampilkan karya dari 15 desainer muda Indonesia.", highlights: ["15 desainer muda Indonesia", "Guided tour setiap jam 11 & 15", "Workshop mini gratis", "Katalog pameran digital"], cover_image_url: "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800&h=500&fit=crop" },
  { title: "Fashion Business Networking Night", category: "Networking", date_label: "18 Mei 2026", time_label: "18:00 — 21:00 WIB", location: "Potato Head, Jakarta", address: "Jl. Gatot Subroto Kav.18, SCBD, Jakarta", price_idr: 150000, is_free: false, spots: 50, spots_left: 12, speaker: "Host: FAZ Academy Team", description: "Malam networking eksklusif untuk para pelaku industri fashion Indonesia. Kesempatan untuk bertemu desainer, buyer, dan investor dalam suasana santai.", highlights: ["Welcome drink & canapés", "Speed networking session", "Brand showcase corner", "Exclusive goodie bag"], cover_image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop" },
  { title: "Draping Masterclass: Teknik Couture", category: "Workshop", date_label: "24 Mei 2026", time_label: "09:00 — 17:00 WIB", location: "FAZ Studio, Jakarta Selatan", address: "Jl. Kemang Raya No. 12, Jakarta 12730", price_idr: 500000, is_free: false, spots: 15, spots_left: 3, speaker: "Hana Wijaya", description: "Masterclass eksklusif teknik draping untuk couture. Belajar langsung dari desainer berpengalaman tentang teknik manipulasi kain pada mannequin.", highlights: ["Kelas kecil maksimal 15 orang", "Material premium disediakan", "Lunch & coffee break", "Portfolio photo session"], cover_image_url: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=500&fit=crop" },
  { title: "Seminar: Intellectual Property dalam Fashion", category: "Seminar", date_label: "1 Juni 2026", time_label: "13:00 — 16:00 WIB", location: "Online via Zoom", address: "Link akan dikirim via email H-1", price_idr: 0, is_free: true, spots: 300, spots_left: 178, speaker: "Adv. Budi Hartono & Sari Indah", description: "Seminar tentang pentingnya perlindungan hak kekayaan intelektual bagi desainer fashion Indonesia. Dari hak cipta desain hingga trademark brand.", highlights: ["Gratis untuk anggota FAZ", "Template legal gratis", "Konsultasi singkat 1-on-1", "E-certificate"], cover_image_url: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=500&fit=crop" },
];

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

async function seedCourses() {
  let n = 0;
  for (const c of courses) {
    const slug = slugify(c.title);
    await prisma.course.upsert({
      where: { slug },
      // update: {} → tidak menimpa course yang sudah ada / sudah diedit admin
      update: {},
      create: { slug, is_published: true, ...c },
    });
    n++;
  }
  console.log(`Courses di-seed: ${n} (idempotent by slug).`);
}

async function seedEbooks() {
  let pos = 0;
  for (const e of ebooks) {
    const slug = slugify(e.title);
    await prisma.ebook.upsert({
      where: { slug },
      update: {},
      create: { slug, is_published: true, position: pos, ...e },
    });
    pos++;
  }
  console.log(`E-books di-seed: ${ebooks.length} (idempotent by slug).`);
}

async function seedEvents() {
  let pos = 0;
  for (const e of events) {
    const slug = slugify(e.title);
    await prisma.event.upsert({
      where: { slug },
      update: {},
      create: { slug, is_published: true, position: pos, ...e },
    });
    pos++;
  }
  console.log(`Events di-seed: ${events.length} (idempotent by slug).`);
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
  await seedCourses();
  await seedEbooks();
  await seedEvents();
  await seedBankAccounts();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
