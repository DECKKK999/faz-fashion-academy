import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { COURSE } from "./catalog.js";

// Idempotent: pasang cover_image_url dari catalog.ts ke course yang sudah ada.
// seed.ts melewati course yang sudah ada, jadi perubahan cover butuh update terarah ini.
//
//   npx tsx prisma/update-course-cover.ts
const prisma = new PrismaClient();

async function main() {
  const r = await prisma.course.updateMany({
    where: { slug: COURSE.slug },
    data: { cover_image_url: COURSE.cover_image_url },
  });
  console.log(`Cover di-set untuk ${r.count} course (slug=${COURSE.slug}) -> ${COURSE.cover_image_url}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
