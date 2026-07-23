import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  BookOpen,
  GraduationCap,
  Award,
  ClipboardCheck,
  Star,
  Users,
  Clock,
  CheckCircle2,
  BadgeCheck,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { api, type Course, type PurchaseState, type CourseReviewsResponse, type Review, type PlayerCourse } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, formatCount, formatDuration } from "@/lib/format";
import SeoHead from "@/components/SeoHead";
import StarRatingInput from "@/components/course/StarRatingInput";
import { PROMO_COURSE_SLUG as SLUG, PROMO_COUPON_CODE as COUPON_CODE, PROMO_PRICE_IDR as PROMO_PRICE } from "@/lib/promo";
import promoLennyCard from "@/assets/promo-lenny-card.jpg";
import fazWordmark from "@/assets/faz-wordmark.png";
import sertifikatContoh from "@/assets/sertifikat-contoh.jpg";

const PROMO_QUOTA = 100;

const pink = "hsl(330 81% 55%)";
const blue = "hsl(220 80% 55%)";

// Ubah link YouTube (youtu.be / watch?v= / sudah-embed) jadi URL embed yang bisa dipakai di iframe.
const toYoutubeEmbedUrl = (url: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("youtube.com")) {
      if (u.pathname === "/watch") return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
      if (u.pathname.startsWith("/embed/")) return url;
    }
    return null;
  } catch {
    return null;
  }
};

const heroStats = [
  { icon: BookOpen, value: "6 Bab", label: "Materi terstruktur dan aplikatif" },
  { icon: Clock, value: "Durasi: 1 Jam", label: "Belajar efektif kapan saja" },
  { icon: ClipboardCheck, value: "Final Quiz", label: "Uji pemahaman untuk memperkuat hasil belajar" },
  { icon: Award, value: "Sertifikat", label: "Sertifikat dari FAZ Academy dan Bu Lenny Agustin" },
];

const faqs = [
  {
    q: "Apakah kelas ini dibawakan langsung oleh Lenny Agustin?",
    a: "Instruktur di kelas ini adalah digital twin berbasis AI dari Lenny Agustin. Materi dan cara penyampaiannya dikembangkan dari pengetahuan serta pengalaman beliau, dan telah ditinjau serta disetujui langsung olehnya — bukan sesi pengajaran real-time.",
  },
  {
    q: "Berapa lama saya bisa akses materinya?",
    a: "Akses selamanya setelah pembayaran terverifikasi. Kamu bisa belajar kapan saja, sesuai ritmemu sendiri.",
  },
  {
    q: "Apakah saya dapat sertifikat?",
    a: "Ya. Setelah menyelesaikan seluruh materi dan lulus final quiz, kamu akan mendapatkan sertifikat resmi dari FAZ Academy dan Lenny Agustin.",
  },
  {
    q: "Bagaimana cara pembayarannya?",
    a: "Pembayaran dilakukan via transfer bank. Setelah bukti transfer diunggah, tim kami memverifikasi dan kamu langsung mendapat akses ke kelas.",
  },
  {
    q: "Kenapa harganya bisa lebih murah dari harga normal?",
    a: `Ini promo peluncuran khusus untuk ${PROMO_QUOTA} siswa pertama. Begitu kuota terpenuhi, harga kembali ke harga normal.`,
  },
];

// Header + footer khusus halaman promo: sengaja tanpa menu/keranjang/wishlist/login
// supaya traffic iklan tidak punya jalan keluar sebelum sampai ke tombol beli.
const MinimalHeader = () => (
  <header className="sticky top-0 z-50 h-14 flex items-center px-4 sm:px-6 bg-background/80 backdrop-blur-xl border-b border-border/50">
    <img src={fazWordmark} alt="FAZ Academy" className="h-6 md:h-7 w-auto" />
  </header>
);

const MinimalFooter = () => (
  <footer className="py-8 px-6 text-center border-t border-border">
    <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">
      © 2026 FAZ Academy · Pembayaran aman & terverifikasi manual oleh tim kami
    </p>
    <Link to="/tentang" className="text-[11px] text-muted-foreground underline mt-1 inline-block">
      Tentang FAZ Academy
    </Link>
  </footer>
);

// Baris ulasan yang terus bergeser ke kanan — dobel array-nya supaya
// loop-nya mulus tanpa jeda (paruh pertama tepat menyambung paruh kedua).
const ReviewsMarquee = ({ reviews }: { reviews: Review[] }) => {
  if (reviews.length === 0) return null;
  const items = [...reviews, ...reviews];
  return (
    <div className="relative w-full max-w-lg overflow-hidden mt-6 mb-2 [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div className="flex gap-3 w-max animate-marquee-right hover:[animation-play-state:paused]">
        {items.map((r, i) => (
          <div key={`${r.id}-${i}`} className="shrink-0 w-60 bg-card border border-border rounded-xl px-4 py-3">
            <StarRatingInput value={r.rating} readOnly size={11} className="mb-1.5" />
            <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">"{r.body}"</p>
            <p className="text-[10px] font-medium text-foreground mt-1.5">{r.reviewer?.full_name ?? "Siswa FAZ Academy"}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

const PromoFashionDesign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [state, setState] = useState<PurchaseState>({ enrolled: false, order: null });
  const [aggregate, setAggregate] = useState<CourseReviewsResponse["aggregate"] | null>(null);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [marqueeReviews, setMarqueeReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [introVideoUrl, setIntroVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    api
      .get<Course>(`/courses/slug/${SLUG}`)
      .then(async (c) => {
        setCourse(c);
        try {
          setState(await api.get<PurchaseState>(`/courses/${c.id}/purchase-state`));
        } catch {
          /* anon */
        }
        try {
          const r = await api.get<CourseReviewsResponse>(`/courses/${c.id}/reviews`);
          setAggregate(r.aggregate);
          setTestimonials(
            [...r.reviews]
              .filter((rv) => (rv.body?.length ?? 0) > 40)
              .sort((a, b) => b.rating - a.rating)
              .slice(0, 3)
          );
          setMarqueeReviews(r.reviews.filter((rv) => rv.body).slice(0, 12));
        } catch {
          /* ignore */
        }
        try {
          const player = await api.get<PlayerCourse>(`/player/courses/by-slug/${SLUG}`);
          const introLesson = player.modules.flatMap((m) => m.lessons).find((l) => l.is_free_preview && l.video_url);
          if (introLesson?.video_url) setIntroVideoUrl(introLesson.video_url);
        } catch {
          /* ignore */
        }
      })
      .finally(() => setLoading(false));
  }, [user]);

  const normalPrice = course?.price_idr ?? 500000;
  const discountPct = normalPrice > 0 ? Math.round(((normalPrice - PROMO_PRICE) / normalPrice) * 100) : 0;
  const spotsTaken = Math.min(course?.students_count ?? 0, PROMO_QUOTA);
  const spotsLeft = Math.max(0, PROMO_QUOTA - spotsTaken);
  const progressPct = Math.min(100, (spotsTaken / PROMO_QUOTA) * 100);

  const handleClaim = () => {
    if (!course) return;
    const target = `/beli/${course.id}?coupon=${COUPON_CODE}`;
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  if (loading || !course) {
    return (
      <div className="min-h-screen bg-background">
        <MinimalHeader />
        <div className="pt-16 text-center text-muted-foreground text-sm">Memuat...</div>
      </div>
    );
  }

  const alreadyHasCourse = state.enrolled || (state.order && state.order.status === "paid");

  return (
    <div className="min-h-screen bg-background pb-20">
      <SeoHead
        title={`Promo ${PROMO_QUOTA} Siswa Pertama — ${course.title}`}
        description={`Khusus ${PROMO_QUOTA} siswa pertama: ${course.title} cuma ${formatRupiah(PROMO_PRICE)} (harga normal ${formatRupiah(normalPrice)}).`}
        image={course.cover_image_url ?? undefined}
      />
      <MinimalHeader />

      {/* Urgency bar */}
      <div
        className="sticky top-14 z-40 text-center text-[11px] md:text-xs font-medium tracking-wide py-2 px-4 text-white"
        style={{ background: `linear-gradient(90deg, ${pink}, ${blue})` }}
      >
        🔥 PROMO PELUNCURAN — Khusus {PROMO_QUOTA} Siswa Pertama · Sisa {spotsLeft} Slot
      </div>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-blue-50">
        <div className="absolute top-10 right-10 grid grid-cols-6 gap-2 opacity-30 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          ))}
        </div>
        <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-12 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-x-10 items-start lg:items-stretch">
          {/* Poster (mobile: pertama · desktop: kolom kiri). Cuma 2 grid item (poster + konten harga)
              supaya tinggi tiap kolom independen — nggak ada lagi row-start manual yang gampang buggy. */}
          <div className="relative flex justify-center lg:justify-start order-1 lg:order-1 mb-8 lg:mb-0">
            <img
              src={promoLennyCard}
              alt="Promo kelas Memulai Bisnis Pakaian bersama Lenny Agustin, mentor FAZ Academy"
              className="w-full max-w-sm sm:max-w-md lg:max-w-xl h-auto rounded-2xl"
              width={1400}
              height={1749}
            />
          </div>

          {/* Konten kanan: instruktur ngisi ruang atas, harga+CTA+ulasan ditempel ke bawah (lg:mt-auto) */}
          <div className="order-2 lg:order-2 flex flex-col lg:h-full">
            {/* Instruktur — mobile: urutan ke-4 (terakhir) · desktop: ngisi ruang kosong antara ulasan & harga */}
            {course.instructor_name && (
              <div className="flex items-center gap-4 bg-card/60 border border-border rounded-2xl px-5 py-4 mb-6 order-4 lg:order-none">
                <div className="w-12 h-12 rounded-full bg-card border border-border flex items-center justify-center text-foreground text-base font-medium shrink-0">
                  {course.instructor_name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-0.5">Instruktur</p>
                  <p className="font-serif text-base font-semibold text-foreground">{course.instructor_name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Desainer visioner, dikenal lewat karya-karyanya yang berani, ceria, kontemporer, dan kaya sentuhan budaya Indonesia.
                  </p>
                </div>
              </div>
            )}

            {/* Harga + CTA dst — mobile: urutan ke-2 (setelah poster) · desktop: ditempel ke bawah kolom kanan (lg:mt-auto) */}
            <div className="order-2 lg:order-none lg:mt-auto">
              {/* Harga coret + badge hemat */}
              <div className="flex items-center gap-4 mb-2">
                <span className="text-sm text-muted-foreground line-through">{formatRupiah(normalPrice)}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ background: pink }}>
                  HEMAT {discountPct}%
                </span>
              </div>

              {/* Harga promo besar */}
              <p className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-1">{formatRupiah(PROMO_PRICE)}</p>
              <p className="text-xs text-muted-foreground mb-6">Harga khusus {PROMO_QUOTA} siswa pertama</p>

              {/* Spots progress */}
              <div className="max-w-sm mb-6">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1.5">
                  <span>{spotsTaken} siswa sudah bergabung</span>
                  <span>{spotsLeft} slot tersisa</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${pink}, ${blue})` }}
                  />
                </div>
              </div>

              {/* Tombol klaim */}
              {alreadyHasCourse ? (
                <div className="flex flex-col items-start gap-3">
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <BadgeCheck size={18} /> Kamu sudah memiliki kelas ini
                  </div>
                  <Button asChild size="lg" className="rounded-full px-10 text-xs tracking-[0.2em] uppercase">
                    <a href={`/belajar/${course.slug}`}>Lanjut Belajar</a>
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleClaim}
                  size="lg"
                  className="rounded-full px-10 py-6 text-sm tracking-[0.15em] uppercase font-semibold"
                  style={{ background: `linear-gradient(135deg, ${pink}, ${blue})`, color: "white" }}
                >
                  Klaim Promo Sekarang
                </Button>
              )}

              {/* Trust bar */}
              <div className="flex items-center gap-3 bg-card/80 border border-border rounded-full px-5 py-3 mb-8 mt-6">
                <ShieldCheck size={18} style={{ color: blue }} className="shrink-0" />
                <p className="text-xs md:text-sm font-medium text-foreground">
                  Materi disusun bersama praktisi berpengalaman — bangun brand fashion-mu dari nol!
                </p>
              </div>

              {/* Info durasi/siswa/rating */}
              <div className="flex items-center gap-5 text-xs text-muted-foreground flex-wrap">
                {course.duration_minutes ? (
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {formatDuration(course.duration_minutes)} materi
                  </span>
                ) : null}
                <span className="flex items-center gap-1">
                  <Users size={14} /> {formatCount(course.students_count)} siswa
                </span>
                {aggregate?.average ? (
                  <span className="flex items-center gap-1">
                    <Star size={14} className="text-gold" /> {aggregate.average.toFixed(1)} ({aggregate.count} ulasan)
                  </span>
                ) : null}
              </div>

              {/* Ulasan bergeser — di bawah info siswa & rating */}
              <div className="pb-10 lg:pb-0">
                <ReviewsMarquee reviews={marqueeReviews} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Apa yang Kamu Dapatkan — pakai stat card yang sama dengan hero, supaya info gak dobel dengan desain beda */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-16">
        <h2 className="text-center font-serif text-2xl md:text-3xl font-semibold text-foreground mb-10">
          Apa yang Kamu Dapatkan
        </h2>
        <div className="bg-card border border-border rounded-2xl px-5 py-6 shadow-sm max-w-3xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {heroStats.map(({ icon: Icon, value, label }, i) => (
              <div key={value} className={`text-center px-2 ${i > 0 ? "sm:border-l sm:border-border" : ""}`}>
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-2"
                  style={{ background: i % 2 === 0 ? `linear-gradient(135deg, ${pink}, ${blue})` : `linear-gradient(135deg, ${blue}, ${pink})` }}
                >
                  <Icon size={18} className="text-white" />
                </div>
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: i % 2 === 0 ? pink : blue }}>{value}</p>
                <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contoh Sertifikat — preview watermark saja, tidak bisa diunduh */}
        <div className="max-w-3xl mx-auto mt-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-3">Contoh Sertifikat</p>
          <img
            src={sertifikatContoh}
            alt="Contoh sertifikat kelulusan FAZ Academy (sampel, bukan sertifikat resmi)"
            className="w-full rounded-2xl border border-border shadow-sm"
          />
        </div>
      </section>

      {/* Tentang kelas */}
      {course.description && (
        <section className="max-w-3xl mx-auto px-6 md:px-12 pb-16">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-4 text-center">Tentang Kelas</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line text-sm md:text-base">
            {course.description}
          </p>
        </section>
      )}

      {/* Cuplikan Kelas — teaser video intro, section sendiri di bawah Tentang Kelas */}
      {introVideoUrl && toYoutubeEmbedUrl(introVideoUrl) && (
        <section className="max-w-3xl mx-auto px-6 md:px-12 pb-16">
          <h2 className="font-serif text-2xl md:text-3xl font-semibold text-foreground mb-6 text-center">Cuplikan Kelas</h2>
          <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border shadow-sm bg-black">
            <iframe
              src={toYoutubeEmbedUrl(introVideoUrl) ?? undefined}
              title="Cuplikan kelas Memulai Bisnis Pakaian"
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </section>
      )}

      {/* Testimonials */}
      {testimonials.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 md:px-12 py-16">
          <h2 className="text-center font-serif text-2xl md:text-3xl font-semibold text-foreground mb-10">
            Kata Mereka yang Sudah Bergabung
          </h2>
          <div className="grid md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.id} className="border border-border rounded-xl p-5 bg-card flex flex-col">
                <StarRatingInput value={t.rating} readOnly size={14} className="mb-3" />
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">"{t.body}"</p>
                <p className="text-xs font-medium text-foreground mt-4">{t.reviewer?.full_name ?? "Siswa FAZ Academy"}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FAQ */}
      <section className="max-w-2xl mx-auto px-6 md:px-12 py-16">
        <h2 className="text-center font-serif text-2xl md:text-3xl font-semibold text-foreground mb-8">
          Pertanyaan yang Sering Ditanyakan
        </h2>
        <div className="space-y-2">
          {faqs.map((f, i) => (
            <div key={f.q} className="border border-border rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenFaq((prev) => (prev === i ? null : i))}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground"
              >
                {f.q}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-muted-foreground transition-transform"
                  style={{ transform: openFaq === i ? "rotate(180deg)" : "none" }}
                />
              </button>
              {openFaq === i && (
                <p className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed">{f.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      {!alreadyHasCourse && (
        <section className="px-6 md:px-12 pb-20">
          <div
            className="max-w-3xl mx-auto rounded-2xl px-8 py-12 text-center text-white"
            style={{ background: `linear-gradient(135deg, ${pink}, ${blue})` }}
          >
            <h2 className="font-serif text-2xl md:text-3xl font-semibold mb-3">
              Jangan Sampai Kehabisan Slot
            </h2>
            <p className="text-sm opacity-90 mb-6 max-w-md mx-auto">
              Sisa {spotsLeft} dari {PROMO_QUOTA} slot promo peluncuran. Setelah kuota penuh, harga kembali ke {formatRupiah(normalPrice)}.
            </p>
            <Button
              onClick={handleClaim}
              size="lg"
              variant="secondary"
              className="rounded-full px-10 py-6 text-sm tracking-[0.15em] uppercase font-semibold"
            >
              Klaim Promo {formatRupiah(PROMO_PRICE)}
            </Button>
            <div className="flex items-center justify-center gap-5 text-[11px] opacity-90 mt-6 flex-wrap">
              <span className="flex items-center gap-1"><ShieldCheck size={14} /> Pembayaran Aman</span>
              <span className="flex items-center gap-1"><CheckCircle2 size={14} /> Akses Selamanya</span>
              <span className="flex items-center gap-1"><GraduationCap size={14} /> Sertifikat Resmi</span>
            </div>
          </div>
        </section>
      )}

      <MinimalFooter />

      {/* Sticky CTA — tetap kelihatan pas di-scroll, di mobile & desktop. Ada sisa slot buat nambah urgensi. */}
      {!alreadyHasCourse && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-card border-t border-border">
          <div className="max-w-7xl mx-auto px-3 md:px-12 pt-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span>🔥 Sisa {spotsLeft} slot promo</span>
              <span>{spotsTaken}/{PROMO_QUOTA} siswa bergabung</span>
            </div>
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${progressPct}%`, background: `linear-gradient(90deg, ${pink}, ${blue})` }}
              />
            </div>
          </div>
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 md:justify-end md:px-12 p-3 pt-2">
            <div className="md:mr-6">
              <p className="text-[10px] text-muted-foreground line-through leading-none">{formatRupiah(normalPrice)}</p>
              <p className="text-base font-serif font-bold text-foreground leading-tight">{formatRupiah(PROMO_PRICE)}</p>
            </div>
            <Button
              onClick={handleClaim}
              className="flex-1 md:flex-none md:px-10 rounded-full text-xs tracking-[0.1em] uppercase font-semibold"
              style={{ background: `linear-gradient(135deg, ${pink}, ${blue})`, color: "white" }}
            >
              Klaim Promo
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromoFashionDesign;
