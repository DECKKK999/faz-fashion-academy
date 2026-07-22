import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { COURSE } from "./catalog.js";
import { QUIZ, QUIZ_QUESTIONS } from "./quiz-catalog.js";

const prisma = new PrismaClient();

// Pemakaian:
//   npm run seed:quiz                      → kelas katalog default
//   npm run seed:quiz -- <slug-kelas>      → kelas lain
//   npm run seed:quiz -- <slug> --replace  → hapus soal lama, tulis ulang dari PDF
const args = process.argv.slice(2);
const slug = args.find((a) => !a.startsWith("--")) ?? COURSE.slug;
const replace = args.includes("--replace");

async function main() {
  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, title: true },
  });
  if (!course) {
    console.error(`Kelas dengan slug '${slug}' tidak ditemukan.`);
    console.error("Jalankan `npm run seed` dulu, atau berikan slug yang benar sebagai argumen.");
    process.exit(1);
  }

  const quiz = await prisma.quiz.upsert({
    where: { course_id: course.id },
    create: {
      course_id: course.id,
      title: QUIZ.title,
      description: QUIZ.description,
      passing_score: QUIZ.passing_score,
      is_published: true,
    },
    // Jangan timpa pengaturan yang mungkin sudah diubah admin.
    update: {},
    select: { id: true, title: true, passing_score: true },
  });

  const existingQuestions = await prisma.quizQuestion.count({ where: { quiz_id: quiz.id } });
  if (existingQuestions > 0 && !replace) {
    console.log(
      `Kuis '${quiz.title}' untuk kelas '${course.title}' sudah punya ${existingQuestions} soal — dilewati.`,
    );
    console.log("Gunakan flag --replace untuk menulis ulang soal dari PDF.");
    return;
  }
  if (existingQuestions > 0) {
    await prisma.quizQuestion.deleteMany({ where: { quiz_id: quiz.id } });
    console.log(`${existingQuestions} soal lama dihapus (--replace).`);
  }

  for (const [i, q] of QUIZ_QUESTIONS.entries()) {
    if (q.options.filter((o) => o.correct).length !== 1) {
      throw new Error(`Soal #${i + 1} harus punya tepat satu jawaban benar.`);
    }
    await prisma.quizQuestion.create({
      data: {
        quiz_id: quiz.id,
        prompt: q.prompt,
        explanation: q.explanation ?? null,
        position: i,
        options: {
          create: q.options.map((o, oi) => ({
            text: o.text,
            is_correct: !!o.correct,
            position: oi,
          })),
        },
      },
    });
  }

  console.log(
    `Kuis '${quiz.title}' siap untuk kelas '${course.title}': ` +
      `${QUIZ_QUESTIONS.length} soal, nilai lulus ${quiz.passing_score}.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
