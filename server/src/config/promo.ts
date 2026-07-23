// Promo peluncuran "100 siswa pertama" — mirrors src/lib/promo.ts on the frontend.
// Dipakai di server supaya diskon ter-apply otomatis di SEMUA jalur pembuatan order
// (checkout langsung, cart, atau jalur baru di masa depan), bukan cuma yang di-trigger
// lewat query param ?coupon= dari frontend.
export const PROMO_COURSE_SLUG = "kelas-fashion-design-faz";
export const PROMO_COUPON_CODE = "PROMO100";
