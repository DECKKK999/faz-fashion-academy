import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { COURSE, MODULES, LESSON_COUNT, createCatalogCourse } from "./catalog.js";

// ---------------------------------------------------------------------------
// SCRIPT DESTRUKTIF — hapus SELURUH katalog (courses, ebooks, events) lalu
// buat ulang HANYA satu kursus dari catalog.ts.
//
//   npx tsx prisma/reset-catalog.ts            # dry-run: hanya menampilkan dampak
//   CONFIRM=1 npx tsx prisma/reset-catalog.ts  # benar-benar menghapus & membuat ulang
//
// Cascade penting (lihat schema.prisma):
//   - hapus course  -> IKUT terhapus: modules, lessons, enrollments, reviews,
//                      certificates, lesson_progress, DAN orders bertipe course.
//   - hapus ebook   -> ebook_grants ikut terhapus; orders.ebook_id di-set NULL.
//   - hapus event   -> event_tickets ikut terhapus; orders.event_id di-set NULL.
// ---------------------------------------------------------------------------

const prisma = new PrismaClient();

async function main() {
  const [
    ebooks,
    events,
    courses,
    enrollments,
    courseOrders,
    ebookOrders,
    eventOrders,
    tickets,
    grants,
    certs,
    reviews,
    progress,
  ] = await Promise.all([
    prisma.ebook.count(),
    prisma.event.count(),
    prisma.course.count(),
    prisma.enrollment.count(),
    prisma.order.count({ where: { item_type: "course" } }),
    prisma.order.count({ where: { item_type: "ebook" } }),
    prisma.order.count({ where: { item_type: "event" } }),
    prisma.eventTicket.count(),
    prisma.ebookGrant.count(),
    prisma.certificate.count(),
    prisma.review.count(),
    prisma.lessonProgress.count(),
  ]);

  console.log("=== KATALOG SAAT INI (akan DIHAPUS) ===");
  console.log(`  ebooks:            ${ebooks}`);
  console.log(`  events:            ${events}`);
  console.log(`  courses:           ${courses}  -> diganti 1 kursus baru`);
  console.log("  --- data turunan yang ikut terdampak ---");
  console.log(`  enrollments:       ${enrollments}   (terhapus via cascade course)`);
  console.log(`  orders (course):   ${courseOrders}   (TERHAPUS via cascade course)`);
  console.log(`  orders (ebook):    ${ebookOrders}   (ebook_id -> NULL, order tetap ada)`);
  console.log(`  orders (event):    ${eventOrders}   (event_id -> NULL, order tetap ada)`);
  console.log(`  event_tickets:     ${tickets}   (terhapus via cascade event)`);
  console.log(`  ebook_grants:      ${grants}   (terhapus via cascade ebook)`);
  console.log(`  certificates:      ${certs}   (terhapus via cascade course)`);
  console.log(`  reviews:           ${reviews}   (terhapus via cascade course)`);
  console.log(`  lesson_progress:   ${progress}   (terhapus via cascade course)`);
  console.log("=======================================");

  if (process.env.CONFIRM !== "1") {
    console.log("\nDRY RUN — tidak ada perubahan.");
    console.log("Jalankan ulang dengan CONFIRM=1 untuk menghapus katalog & membuat kursus baru.");
    return;
  }

  console.log("\nCONFIRM=1 — menghapus katalog lama...");
  await prisma.$transaction(async (tx) => {
    // Keranjang & wishlist mereferensikan produk katalog (product_id generik,
    // tanpa FK) — bersihkan agar tidak ada entri menggantung.
    await tx.cartItem.deleteMany({});
    await tx.wishlist.deleteMany({});

    await tx.event.deleteMany({}); // cascade: event_tickets; orders.event_id -> NULL
    await tx.ebook.deleteMany({}); // cascade: ebook_grants; orders.ebook_id -> NULL
    await tx.course.deleteMany({}); // cascade: modules, lessons, enrollments, reviews, certificates, lesson_progress, orders(course)
  });

  const course = await createCatalogCourse(prisma);
  console.log(`\nSelesai. Kursus baru: "${course.title}" (${course.slug})`);
  console.log(`  modul: ${MODULES.length}, pelajaran: ${LESSON_COUNT}, harga: Rp${COURSE.price_idr}`);
  console.log("  CATATAN: atur harga & cover kursus di Admin sebelum dipromosikan.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
