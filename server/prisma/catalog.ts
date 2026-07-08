import type { PrismaClient } from "@prisma/client";

// ---------------------------------------------------------------------------
// Katalog kursus tunggal FAZ Academy.
// Sumber: Google Doc "Kelas Fashion Design FAZ" (Intro + BAB 1–6, video YouTube).
// Dipakai bersama oleh seed.ts (idempotent) dan reset-catalog.ts (destruktif).
// ---------------------------------------------------------------------------

export const COURSE = {
  slug: "kelas-fashion-design-faz",
  title: "Kelas Fashion Design FAZ",
  subtitle: "Belajar fashion design dari dasar hingga mahir bersama FAZ Academy.",
  description:
    "Kelas fashion design lengkap dari FAZ Academy: mulai dari pengantar, lalu bab demi bab " +
    "yang membahas fondasi hingga teknik lanjutan lewat video pembelajaran yang terstruktur.",
  category: "Desain",
  level: "Pemula",
  instructor_name: "FAZ Academy",
  // TODO: atur harga sebenarnya lewat Admin sebelum kursus dipromosikan (0 = gratis).
  price_idr: 0,
  // Cover default (aset di frontend public/, disajikan dari root domain).
  cover_image_url: "/course-cover-fashion-design.jpg",
} as const;

export type SeedLesson = { title: string; video_url: string; is_free_preview?: boolean };
export type SeedModule = { title: string; lessons: SeedLesson[] };

// Urutan modul & pelajaran mengikuti dokumen (posisi = urutan array).
export const MODULES: SeedModule[] = [
  {
    title: "Pendahuluan",
    lessons: [{ title: "Intro", video_url: "https://youtu.be/Mptd590_Uec", is_free_preview: true }],
  },
  {
    title: "BAB 1",
    lessons: [
      { title: "BAB 1.1", video_url: "https://youtu.be/C0nN5cgJu7s" },
      { title: "BAB 1.2", video_url: "https://youtu.be/gErhcV7qAI0" },
    ],
  },
  {
    title: "BAB 2",
    lessons: [
      { title: "BAB 2.1", video_url: "https://youtu.be/c2690uQ0Lps" },
      { title: "BAB 2.2", video_url: "https://youtu.be/_fzPFQkYODE" },
    ],
  },
  {
    title: "BAB 3",
    lessons: [
      { title: "BAB 3.1", video_url: "https://youtu.be/0U9hhPPEe_Q" },
      { title: "BAB 3.2", video_url: "https://youtu.be/SCMHE7Ms70s" },
    ],
  },
  {
    title: "BAB 4",
    lessons: [
      { title: "BAB 4.1", video_url: "https://youtu.be/JlxLKn43LW0" },
      { title: "BAB 4.2", video_url: "https://youtu.be/il7UXsrFJl4" },
    ],
  },
  {
    title: "BAB 5",
    lessons: [
      { title: "BAB 5.1", video_url: "https://youtu.be/__kxCil5To4" },
      { title: "BAB 5.2", video_url: "https://youtu.be/XNRWLCxjync" },
    ],
  },
  {
    title: "BAB 6",
    lessons: [
      { title: "BAB 6.1", video_url: "https://youtu.be/SL7gr_VzJkY" },
      { title: "BAB 6.2", video_url: "https://youtu.be/kX3YpfyYnuc" },
    ],
  },
];

export const LESSON_COUNT = MODULES.reduce((n, m) => n + m.lessons.length, 0);

// Buat course + modul + pelajaran dalam satu nested write (atomik).
export function createCatalogCourse(db: PrismaClient) {
  return db.course.create({
    data: {
      slug: COURSE.slug,
      title: COURSE.title,
      subtitle: COURSE.subtitle,
      description: COURSE.description,
      category: COURSE.category,
      level: COURSE.level,
      instructor_name: COURSE.instructor_name,
      price_idr: COURSE.price_idr,
      cover_image_url: COURSE.cover_image_url,
      is_published: true,
      modules: {
        create: MODULES.map((mod, mi) => ({
          title: mod.title,
          position: mi,
          lessons: {
            create: mod.lessons.map((lesson, li) => ({
              title: lesson.title,
              video_url: lesson.video_url,
              position: li,
              is_free_preview: lesson.is_free_preview ?? false,
            })),
          },
        })),
      },
    },
  });
}
