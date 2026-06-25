// Formatting helpers shared across the app.

export const formatRupiah = (n: number | null | undefined) =>
  typeof n === "number" ? `Rp ${n.toLocaleString("id-ID")}` : "";

export const formatDuration = (minutes: number | null | undefined) => {
  if (!minutes) return "";
  if (minutes % 60 === 0) return `${minutes / 60} jam`;
  if (minutes > 60) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h} jam ${m} mnt`;
  }
  return `${minutes} mnt`;
};

export const formatCount = (n: number | null | undefined) =>
  typeof n === "number" ? n.toLocaleString("id-ID") : "0";

export const ORDER_STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu Pembayaran", className: "bg-amber-500/15 text-amber-600" },
  awaiting_verification: { label: "Menunggu Verifikasi", className: "bg-blue-500/15 text-blue-600" },
  paid: { label: "Lunas", className: "bg-emerald-500/15 text-emerald-600" },
  rejected: { label: "Ditolak", className: "bg-red-500/15 text-red-600" },
  expired: { label: "Kedaluwarsa", className: "bg-muted text-muted-foreground" },
  cancelled: { label: "Dibatalkan", className: "bg-muted text-muted-foreground" },
};

export const orderStatus = (s: string) =>
  ORDER_STATUS[s] ?? { label: s, className: "bg-muted text-muted-foreground" };

// Item polimorfik dari sebuah order (course | ebook | event) → bagian umum untuk ditampilkan.
type AnyOrderItem = { title: string; cover_image_url: string | null; slug: string; category: string | null } | null | undefined;
export const orderItemOf = (o: { course?: AnyOrderItem; ebook?: AnyOrderItem; event?: AnyOrderItem }) =>
  o.course ?? o.ebook ?? o.event ?? null;

export const orderItemTypeLabel = (t: string) =>
  ({ course: "Kelas", ebook: "E-Book", event: "Event" } as Record<string, string>)[t] ?? t;

