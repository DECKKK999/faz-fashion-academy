import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import multer from "multer";
import { env } from "./env.js";
import { UPLOAD_DIR } from "./upload.js";
import { authLimiter } from "./middleware/rateLimit.js";
import { authRouter } from "./routes/auth.js";
import { coursesRouter } from "./routes/courses.js";
import { ebooksRouter } from "./routes/ebooks.js";
import { eventsRouter } from "./routes/events.js";
import { modulesRouter, lessonsRouter } from "./routes/curriculum.js";
import { usersRouter } from "./routes/users.js";
import { statsRouter } from "./routes/stats.js";
import { ordersRouter, adminOrdersRouter } from "./routes/orders.js";
import { enrollmentsRouter } from "./routes/enrollments.js";
import { paymentRouter } from "./routes/payment.js";
import { bankAccountsRouter } from "./routes/bankAccounts.js";
import { playerRouter } from "./routes/player.js";
import { certificatesRouter, adminCertificatesRouter } from "./routes/certificates.js";
import { quizRouter, adminQuizRouter } from "./routes/quiz.js";
import { reviewsRouter, adminReviewsRouter } from "./routes/reviews.js";
import { couponsRouter, adminCouponsRouter } from "./routes/coupons.js";
import { accountRouter } from "./routes/account.js";
import { adminEmailRouter } from "./routes/adminEmail.js";
import { reportsRouter } from "./routes/reports.js";
import { libraryRouter } from "./routes/library.js";
import { cartRouter } from "./routes/cart.js";
import { wishlistRouter } from "./routes/wishlist.js";
import { gatewayRouter, adminGatewayRouter } from "./routes/gateway.js";

const app = express();

app.set("trust proxy", 1); // agar rate-limit & secure cookie melihat IP/proto asli di belakang proxy
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: env.CLIENT_ORIGIN,
    credentials: true,
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Bukti pembayaran yang diunggah (di-proxy Vite via /api saat dev)
app.use("/api/uploads", express.static(UPLOAD_DIR));

app.use("/api/auth", authLimiter, authRouter);
app.use("/api/account", accountRouter);
app.use("/api/courses", coursesRouter);
app.use("/api/courses", reviewsRouter); // sub-paths /:id/reviews — tidak bentrok dgn coursesRouter
app.use("/api/player", playerRouter);
app.use("/api/ebooks", ebooksRouter);
app.use("/api/events", eventsRouter);
app.use("/api/modules", modulesRouter);
app.use("/api/lessons", lessonsRouter);
app.use("/api/users", usersRouter);
app.use("/api/stats", statsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/library", libraryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/coupons", couponsRouter);
app.use("/api/certificates", certificatesRouter);
app.use("/api/quizzes", quizRouter);
app.use("/api/payment-gateway", gatewayRouter);
app.use("/api/enrollments", enrollmentsRouter);
app.use("/api/payment-info", paymentRouter);
// admin
app.use("/api/admin/orders", adminOrdersRouter);
app.use("/api/admin/bank-accounts", bankAccountsRouter);
app.use("/api/admin/reviews", adminReviewsRouter);
app.use("/api/admin/coupons", adminCouponsRouter);
app.use("/api/admin/certificates", adminCertificatesRouter);
app.use("/api/admin/quizzes", adminQuizRouter);
app.use("/api/admin/email", adminEmailRouter);
app.use("/api/admin/payment-gateway", adminGatewayRouter);

// 404 for unknown API routes
app.use("/api", (_req, res) => res.status(404).json({ error: "Not found" }));

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // Multer / upload errors → 400 dengan pesan jelas
  if (err instanceof multer.MulterError) {
    const msg = err.code === "LIMIT_FILE_SIZE" ? "Ukuran file maksimal 5 MB" : err.message;
    return res.status(400).json({ error: msg });
  }
  if (err instanceof Error && /file tidak didukung|harus berupa gambar|harus PDF/i.test(err.message)) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Terjadi kesalahan pada server" });
});

app.listen(env.PORT, () => {
  console.log(`API server berjalan di http://localhost:${env.PORT}`);
});
