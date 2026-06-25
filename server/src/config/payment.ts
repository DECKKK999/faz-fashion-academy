// Konfigurasi pembayaran transfer offline.
// Rekening kini dikelola lewat Admin → Pengaturan (tabel bank_accounts).
// Daftar di bawah hanya dipakai sebagai data awal (seed) bila tabel masih kosong.

export const DEFAULT_BANK_ACCOUNTS = [
  {
    bank: "BCA",
    account_number: "1234567890",
    account_name: "PT FAZ Academy Indonesia",
  },
  {
    bank: "Mandiri",
    account_number: "9876543210",
    account_name: "PT FAZ Academy Indonesia",
  },
];

export const PAYMENT_INSTRUCTIONS = [
  "Transfer TEPAT sampai 3 digit terakhir (kode unik) agar pembayaran mudah dicocokkan.",
  "Lakukan transfer ke salah satu rekening di atas sebelum batas waktu.",
  "Setelah transfer, unggah bukti transfer dan isi data pengirim.",
  "Pembayaran akan diverifikasi staff dalam 1x24 jam pada hari kerja.",
];

// Batas waktu pembayaran sejak order dibuat.
export const ORDER_EXPIRY_HOURS = 24;

// Rentang kode unik (3 digit) yang ditambahkan ke nominal.
export const UNIQUE_CODE_MIN = 100;
export const UNIQUE_CODE_MAX = 999;
