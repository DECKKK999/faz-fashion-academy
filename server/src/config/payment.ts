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

// Batas waktu pembayaran sejak order dibuat.
export const ORDER_EXPIRY_HOURS = 24;
