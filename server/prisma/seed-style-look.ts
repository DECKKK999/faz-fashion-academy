import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Kelas ke-2: "Style & Look" (8 video, Tugas Akhir berupa unggah karya — tanpa Final Quiz).
// Penamaan pelajaran mengikuti naskah: VIDEO 1 = "Pengantar", VIDEO 2..8 = "BAB 2".."BAB 8".
//
//   npm run seed:style-look
//
// Idempotent: kalau kelasnya (slug) sudah ada, tidak ada yang ditimpa — perubahan lanjutan
// (harga, cover, deskripsi, instruksi tugas) dilakukan dari admin. Kelas dibuat sebagai DRAFT
// (is_published = false); aktifkan dari admin setelah cover terpasang.
const prisma = new PrismaClient();

const SLUG = "style-look";

const COURSE = {
  slug: SLUG,
  title: "Style & Look: Fondasi Cara Berpikir Fashion Stylist dan Desainer Busana",
  subtitle:
    "Pelajari cara membaca fashion dengan lebih peka: bedakan style sebagai karakter dan look sebagai tema, kuasai enam style dasar, lalu praktikkan lewat studi kasus Army Look dan Tugas Akhir yang bisa jadi halaman portofolio.",
  description: [
    "Kenapa sebuah outfit terasa elegan? Kenapa satu koleksi terasa sporty? Kenapa satu tampilan langsung mengingatkan kita pada militer, boneka, atau budaya tertentu?",
    "Kelas ini membahas dua fondasi cara berpikir seorang fashion stylist dan desainer busana: style, yaitu karakter seseorang dalam berpakaian, dan look, yaitu tampilan yang menyerupai sesuatu. Begitu keduanya bisa dibedakan, proses mendesain busana akan terasa jauh lebih terarah.",
    [
      "Yang akan kamu pelajari:",
      "• Perbedaan style dan look, dan bagaimana keduanya saling melengkapi",
      "• Enam style dasar: Classic Elegant, Sporty Casual, Feminine Romantic, Sexy Alluring, Arty Off Beat, dan Exotic Dramatic, lengkap dengan konteks Indonesia",
      "• Cara menggabungkan dua sampai tiga style dengan rumus 70-20-10",
      "• Konsep look: dari era mode, profesi dan seragam, sampai referensi lokal Indonesia",
      "• Studi kasus Army Look dan adaptasinya ke enam style dasar",
      "• Alur kerja stylist dari brief klien sampai pemilihan item, lewat segmen \"Di Dunia Kerja\"",
    ].join("\n"),
    "Kelas ditutup dengan Tugas Akhir: pilih satu look, riset sejarah dan ciri visualnya, lalu adaptasikan ke minimal tiga style dasar. Hasilnya kamu unggah sebagai karya dan bisa langsung dipakai sebagai halaman portofolio. Sertifikat diterbitkan setelah semua pelajaran selesai dan Tugas Akhir dikumpulkan.",
  ].join("\n\n"),
  price_idr: 250000,
  level: "Pemula",
  category: "Desain",
  instructor_name: "Lenny Agustin",
  duration_minutes: 56, // 3.381 detik total video
};

type SeedLesson = { title: string; video: string; minutes: number; free: boolean; content: string };
type SeedModule = { title: string; lesson: SeedLesson };

const MODULES: SeedModule[] = [
  {
    title: "Pengantar",
    lesson: {
      title: "Pengantar – Bedanya Style dan Look",
      video: "https://youtu.be/_Kc6rGs-bgA",
      minutes: 5,
      free: true,
      content:
        "Apa bedanya style dan look? Di video pembuka ini kamu mengenal style sebagai karakter dan look sebagai referensi visual, melihat contoh Army Look dengan dua style berbeda, lalu berkenalan dengan enam style dasar dan peta perjalanan kelas.",
    },
  },
  {
    title: "BAB 2",
    lesson: {
      title: "BAB 2 – Classic Elegant dan Sporty Casual",
      video: "https://youtu.be/suP2Qz8cbWA",
      minutes: 6,
      free: false,
      content:
        "Dua style dasar pertama: Classic Elegant yang rapi, berkualitas, dan timeless, serta Sporty Casual yang santai, aktif, dan praktis. Dibahas karakter, warna, bahan, konteks Indonesia, perbandingan langsung, cara memadukannya, dan segmen Di Dunia Kerja: menerjemahkan brief klien menjadi style.",
    },
  },
  {
    title: "BAB 3",
    lesson: {
      title: "BAB 3 – Feminine Romantic dan Sexy Alluring",
      video: "https://youtu.be/nzk5LRl6xhE",
      minutes: 8,
      free: false,
      content:
        "Dua style dengan daya tarik visual kuat: Feminine Romantic yang lembut dan manis, serta Sexy Alluring yang percaya diri dan glamor. Termasuk konteks Indonesia, perbandingan langsung, rumus keseimbangan 70/30, dan studi brief pre-wedding di segmen Di Dunia Kerja.",
    },
  },
  {
    title: "BAB 4",
    lesson: {
      title: "BAB 4 – Arty Off Beat dan Exotic Dramatic",
      video: "https://youtu.be/neE8zJ-0qA0",
      minutes: 7,
      free: false,
      content:
        "Dua style yang ekspresif: Arty Off Beat yang artistik dan eksperimental, serta Exotic Dramatic yang etnik, craft-based, dan dramatis. Termasuk etika memakai referensi budaya, cara menjaga satu fokus visual, dan studi brief koleksi brand lokal.",
    },
  },
  {
    title: "BAB 5",
    lesson: {
      title: "BAB 5 – Menggabungkan 2–3 Style",
      video: "https://youtu.be/NjOjo8qfDmU",
      minutes: 7,
      free: false,
      content:
        "Cara memadukan dua sampai tiga style dengan rumus 70-20-10 (style utama, pendukung, aksen), tiga contoh mix style, checklist lima pertanyaan penguji, dan alur kerja lima langkah stylist: Brief, Style, Proporsi, Keputusan Visual, lalu Item.",
    },
  },
  {
    title: "BAB 6",
    lesson: {
      title: "BAB 6 – Apa Itu Look dalam Fashion?",
      video: "https://youtu.be/xKw-tNb9T30",
      minutes: 7,
      free: false,
      content:
        "Memahami look sebagai tampilan yang menyerupai sesuatu. Dibahas sumber look (era mode, profesi dan seragam, referensi lokal Indonesia), fungsi look dalam desain koleksi, titik temu style dan look, serta peran look sebagai alat komunikasi tim.",
    },
  },
  {
    title: "BAB 7",
    lesson: {
      title: "BAB 7 – Studi Kasus: Army Look",
      video: "https://youtu.be/5Nw4jn25q08",
      minutes: 10,
      free: false,
      content:
        "Studi kasus Army Look: sejarah singkat trench coat, enam ciri visual (siluet, motif camo, warna tanah, item khas, bahan, dan detail utilitarian), Army Look dalam konteks Indonesia, catatan etis soal mengambil bahasa desain, contoh penerapan, dan alasan riset look itu wajib.",
    },
  },
  {
    title: "BAB 8",
    lesson: {
      title: "BAB 8 – Adaptasi Look ke Enam Style dan Tugas Akhir",
      video: "https://youtu.be/bYRyVGK4EWQ",
      minutes: 7,
      free: false,
      content:
        "Bagaimana satu look berubah ketika diterapkan ke enam style dasar lewat adaptasi Army Look, lalu penjelasan Tugas Akhir: pilih satu look, riset, dan adaptasikan ke minimal tiga style dasar.",
    },
  },
];

const ASSIGNMENT = {
  title: "Tugas Akhir",
  description: [
    "Kerjakan tugas ini sebagai simulasi kerja, bukan tugas sekolah. Bentuknya sama dengan yang diminta dari seorang stylist atau desainer saat menerima proyek baru: riset referensi, tentukan arah, lalu tunjukkan bahwa satu arah bisa dieksekusi dengan beberapa cara. Kalau dikerjakan dengan serius, hasilnya bisa langsung kamu pakai sebagai halaman pertama portofolio.",
    "Pilih satu fashion look yang menurutmu menarik, misalnya Army Look, Safari Look, Punk Look, Gothic Look, Doll Look, Oriental Look, Modest Look, Kebaya Look, Ethnic Look, Futuristic Look, atau look lain yang memiliki referensi visual yang jelas.",
    [
      "Jelaskan tujuh hal berikut:",
      "1. Nama look yang dipilih.",
      "2. Definisi look tersebut.",
      "3. Sejarah singkatnya.",
      "4. Tokoh, desainer, film, musisi, budaya populer, atau kelompok yang mempopulerkan look tersebut.",
      "5. Ciri visualnya, termasuk warna, bahan, motif, siluet, item, dan detail.",
      "6. Kumpulan gambar referensi yang sesuai.",
      "7. Adaptasi look tersebut ke minimal tiga style dasar.",
    ].join("\n"),
    "Contoh: kalau kamu memilih look yang menggunakan kain batik sebagai inspirasi utama, buat versi Classic Elegant, Sporty Casual, dan Arty Off Beat. Kalau memilih Kebaya Look, buat versi Feminine Romantic, Sexy Alluring, dan Exotic Dramatic. Kalau memilih Army Look, kamu bisa memakai contoh yang sudah dibahas di kelas, lalu mengembangkannya dengan ide sendiri.",
    "Gabungkan seluruh hasilnya dalam satu file (disarankan PDF, atau gambar JPG/PNG/WebP), lalu unggah di halaman ini.",
  ].join("\n\n"),
};

async function main() {
  const existing = await prisma.course.findUnique({ where: { slug: SLUG }, select: { id: true, title: true } });
  if (existing) {
    console.log(`Kelas '${existing.title}' (slug=${SLUG}) sudah ada — dilewati, tidak ada yang ditimpa.`);
    return;
  }

  const course = await prisma.$transaction(async (tx) => {
    const created = await tx.course.create({ data: { ...COURSE, is_published: false } });

    for (const [mi, m] of MODULES.entries()) {
      const mod = await tx.module.create({ data: { course_id: created.id, title: m.title, position: mi } });
      await tx.lesson.create({
        data: {
          module_id: mod.id,
          title: m.lesson.title,
          video_url: m.lesson.video,
          duration_minutes: m.lesson.minutes,
          is_free_preview: m.lesson.free,
          content: m.lesson.content,
          position: 0,
        },
      });
    }

    await tx.assignment.create({
      data: { course_id: created.id, title: ASSIGNMENT.title, description: ASSIGNMENT.description, is_published: true },
    });
    return created;
  });

  console.log(`Kelas dibuat (DRAFT): ${course.title}`);
  console.log(`  slug=${course.slug} · ${MODULES.length} modul/pelajaran · harga Rp ${course.price_idr.toLocaleString("id-ID")} · Tugas Akhir aktif`);
  console.log("  Pasang cover lalu aktifkan (Published) dari /admin/courses.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
