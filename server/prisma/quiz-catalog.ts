// ---------------------------------------------------------------------------
// Final Quiz — "Memulai Bisnis Pakaian: Dari Ide hingga Strategi Bisnis"
// Sumber: dokumen "Final Quiz.pdf" (10 soal, 3 level, bobot 10 poin per soal).
// Kelulusan: >= 70 poin (7 jawaban benar).
// Dipakai oleh seed-quiz.ts. Soal tetap dapat diedit lewat /admin setelah seed.
// ---------------------------------------------------------------------------

export const QUIZ = {
  title: "Final Quiz — Evaluasi Akhir",
  description:
    "Evaluasi akhir kelas: 10 soal pilihan ganda dengan tingkat kesulitan bertahap " +
    "(dasar → aplikatif → analitis). Setiap soal bernilai 10 poin. Nilai minimum kelulusan 70.",
  passing_score: 70,
} as const;

export type SeedQuizQuestion = {
  prompt: string;
  /** Catatan/pembahasan internal — tidak ditampilkan ke peserta. */
  explanation?: string;
  /** Urutan pilihan mengikuti urutan array; tepat satu bertanda `correct`. */
  options: { text: string; correct?: boolean }[];
};

export const QUIZ_QUESTIONS: SeedQuizQuestion[] = [
  // ----- Level 1 — Dasar -----
  {
    prompt: "Fast fashion ditandai oleh…",
    options: [
      { text: "Produksi cepat dengan biaya rendah mengikuti tren musiman", correct: true },
      { text: "Produksi terbatas dengan bahan premium" },
      { text: "Desain tradisional yang tidak berubah" },
      { text: "Produk yang hanya dijual di butik eksklusif" },
    ],
  },
  {
    prompt: "Tujuan utama membuat Fashion Vision Board adalah untuk…",
    options: [
      { text: "Menentukan supplier bahan baku" },
      { text: "Membantu memvisualisasikan arah dan nilai brand kamu", correct: true },
      { text: "Menentukan harga jual" },
      { text: "Menentukan strategi pajak bisnis" },
    ],
  },
  {
    prompt:
      "Komponen inti DNA brand yang paling memengaruhi cara brand berkomunikasi dengan pelanggan adalah…",
    options: [
      { text: "Tone of Voice", correct: true },
      { text: "Harga Produk" },
      { text: "Ukuran Logo" },
      { text: "Gaya Foto Produk" },
    ],
  },

  // ----- Level 2 — Menengah (aplikatif) -----
  {
    prompt: "Berikut yang termasuk dalam indikator Buyer Persona yang baik adalah…",
    options: [
      { text: "Nama fiktif, latar belakang, perilaku belanja, dan tantangan pelanggan", correct: true },
      { text: "Desain logo dan font" },
      { text: "Jumlah followers di media sosial" },
      { text: "Jumlah SKU produk" },
    ],
  },
  {
    prompt:
      "Jika biaya tetap Rp6.000.000, biaya variabel Rp100.000, dan harga jual Rp200.000 per unit, berapa BEP (Break Even Point)?",
    explanation:
      "BEP = Biaya Tetap / (Harga Jual − Biaya Variabel) = 6.000.000 / (200.000 − 100.000) = 60 unit.",
    options: [
      { text: "30 unit" },
      { text: "40 unit" },
      { text: "60 unit", correct: true },
      { text: "120 unit" },
    ],
  },
  {
    prompt: "Dalam strategi soft selling, konten yang paling sesuai adalah…",
    options: [
      { text: "Video edukatif tentang perawatan bahan pakaian", correct: true },
      { text: "Promo “Buy 1 Get 1” setiap hari" },
      { text: "Iklan berulang dengan teks besar “Diskon Besar!”" },
      { text: "Daftar harga grosir lengkap" },
    ],
  },
  {
    prompt: "Salah satu kelebihan sistem produksi maklon dibanding in-house adalah…",
    options: [
      { text: "Kontrol kualitas lebih tinggi" },
      { text: "Tidak perlu memiliki mesin atau tenaga produksi sendiri", correct: true },
      { text: "Modal awal lebih besar" },
      { text: "Produksi lebih lambat" },
    ],
  },

  // ----- Level 3 — Lanjutan (teknis & analitis) -----
  {
    prompt:
      "Jika brand kamu ingin dipersepsikan sebagai “affordable luxury”, strategi positioning yang paling tepat adalah…",
    options: [
      { text: "Menjual produk dengan harga tinggi tanpa promosi digital" },
      { text: "Menggabungkan kemasan premium dengan harga menengah dan layanan personal", correct: true },
      { text: "Menggunakan bahan murah dengan produksi massal" },
      { text: "Fokus ke volume penjualan tinggi tanpa citra brand" },
    ],
  },
  {
    prompt:
      "Dalam circular fashion model, langkah berikut ini menunjukkan penerapan ekonomi berkelanjutan yang benar:",
    options: [
      { text: "Menggunakan bahan sisa produksi untuk membuat aksesori baru", correct: true },
      { text: "Mengganti bahan impor menjadi bahan lokal biasa" },
      { text: "Meningkatkan produksi setiap kuartal" },
      { text: "Menjual semua stok lama dengan diskon besar" },
    ],
  },
  {
    prompt:
      "Saat brand kamu mulai scale-up, keputusan strategis terbaik untuk menjaga stabilitas keuangan adalah…",
    options: [
      { text: "Menambah varian produk tanpa riset pasar" },
      { text: "Menggunakan data penjualan 6 bulan terakhir untuk menentukan prioritas ekspansi", correct: true },
      { text: "Meningkatkan pengeluaran iklan dua kali lipat secara tiba-tiba" },
      { text: "Menutup lini produk lama tanpa analisis performa" },
    ],
  },
];
