// Promo peluncuran "100 siswa pertama" untuk kelas fashion design.
// Dipakai di catalog, homepage, dan halaman detail kelas supaya harga coret konsisten di semua tempat.
export const PROMO_COURSE_SLUG = "kelas-fashion-design-faz";
export const PROMO_COUPON_CODE = "PROMO100";
export const PROMO_PRICE_IDR = 195000;

export const isPromoCourse = (slug: string | null | undefined) => slug === PROMO_COURSE_SLUG;
