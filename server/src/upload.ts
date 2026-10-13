import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import multer from "multer";

export const UPLOAD_DIR = path.resolve(process.cwd(), "uploads");

if (!existsSync(UPLOAD_DIR)) {
  mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = `${req.params.id ?? "order"}-${Date.now()}${ext}`;
    cb(null, safe);
  },
});

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif", "application/pdf"];

export const uploadProof = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (ALLOWED.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format file tidak didukung (gunakan JPG/PNG/WebP/PDF)"));
  },
});

// Avatar upload (gambar saja, dinamai per user)
export const uploadAvatar = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `avatar-${req.user?.id ?? "user"}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Avatar harus berupa gambar"));
  },
});

// Cover course (gambar saja, dinamai per course)
export const uploadCourseCover = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
      cb(null, `course-cover-${req.params.id ?? "x"}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Cover harus berupa gambar (JPG/PNG/WebP)"));
  },
});

// File e-book (PDF) disimpan di direktori PRIVAT — TIDAK disajikan statis.
// Hanya bisa diunduh lewat endpoint ber-gate /api/ebooks/:id/download.
export const PROTECTED_DIR = path.resolve(process.cwd(), "protected");
if (!existsSync(PROTECTED_DIR)) {
  mkdirSync(PROTECTED_DIR, { recursive: true });
}

// Hasil Tugas Akhir peserta — juga di direktori PRIVAT (karya peserta tidak boleh
// terbuka untuk umum). Hanya pemilik dan pengelola yang bisa mengunduh lewat
// /api/assignments/submissions/:id/file.
export const ASSIGNMENT_MAX_BYTES = 15 * 1024 * 1024; // 15 MB
export const ASSIGNMENT_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

export const uploadAssignmentFile = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PROTECTED_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase().replace(/[^.a-z0-9]/g, "") || ".bin";
      cb(null, `assignment-${req.user?.id ?? "user"}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: ASSIGNMENT_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ASSIGNMENT_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format file tidak didukung (gunakan PDF, JPG, PNG, atau WebP)"));
  },
});

export const uploadEbookFile = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, PROTECTED_DIR),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase() || ".pdf";
      cb(null, `ebook-${req.params.id ?? "x"}-${Date.now()}${ext}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("File e-book harus PDF"));
  },
});
