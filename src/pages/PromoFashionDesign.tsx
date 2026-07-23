import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle,
  BookOpen,
  Sparkles,
  GraduationCap,
  Star,
  Users,
  Clock,
  CheckCircle2,
  BadgeCheck,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type Course, type PurchaseState, type CourseReviewsResponse, type Review } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, formatCount } from "@/lib/format";
import SeoHead from "@/components/SeoHead";
import StarRatingInput from "@/components/course/StarRatingInput";
import { PROMO_COURSE_SLUG as SLUG, PROMO_COUPON_CODE as COUPON_CODE, PROMO_PRICE_IDR as PROMO_PRICE } from "@/lib/promo";

const PROMO_QUOTA = 100;

const pink = "hsl(330 81% 55%)";
const blue = "hsl(220 80% 55%)";

const highlights = [
  { icon: BookOpen, label: "6 Bab Terstruktur", desc: "Dari fondasi bisnis sampai strategi scale-up" },
  { icon: PlayCircle, label: "12 Video Materi", desc: "Bisa diakses & diulang kapan saja" },
  { icon: Sparkles, label: "1 Video Pengantar", desc: "Kenali alur belajar sebelum mulai" },
  { icon: GraduationCap, label: "Final Quiz + Sertifikat", desc: "Bukti resmi penyelesaian kelas" },
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

const PromoFashionDesign = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [state, setState] = useState<PurchaseState>({ enrolled: false, order: null });
  const [aggregate, setAggregate] = useState<CourseReviewsResponse["aggregate"] | null>(null);
  const [testimonials, setTestimonials] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

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
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm">Memuat...</div>
      </div>
    );
  }

  const alreadyHasCourse = state.enrolled || (state.order && state.order.status === "paid");

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <SeoHead
        title={`Promo ${PROMO_QUOTA} Siswa Pertama — ${course.title}`}
        description={`Khusus ${PROMO_QUOTA} siswa pertama: ${course.title} cuma ${formatRupiah(PROMO_PRICE)} (harga normal ${formatRupiah(normalPrice)}).`}
        image={course.cover_image_url ?? undefined}
      />
      <Navbar />

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
        <div className="relative max-w-4xl mx-auto px-6 md:px-12 pt-14 pb-12 text-center">
          <div className="flex items-center justify-center gap-2 mb-5 flex-wrap text-[10px] md:text-xs tracking-[0.25em] uppercase text-foreground/70">
            {course.category && <span className="bg-primary/10 text-primary px-3 py-1 rounded-full">{course.category}</span>}
            {course.level && <span className="border border-border px-3 py-1 rounded-full">{course.level}</span>}
          </div>

          <h1 className="text-4xl md:text-5xl leading-[1.1] tracking-tight mb-5">
            <span style={{ color: "hsl(222 47% 15%)" }}>Wujudkan </span>
            <span style={{ color: pink }} className="italic">Brand Fashion</span>
            <br />
            <span style={{ color: "hsl(222 47% 15%)" }}>Impianmu, </span>
            <span style={{ color: blue }} className="italic">Sekarang.</span>
          </h1>

          <p className="max-w-xl mx-auto text-sm md:text-base text-foreground/70 leading-relaxed mb-8">
            {course.subtitle ?? "Belajar membangun brand pakaian dari nol bersama Lenny Agustin, khusus untuk 100 siswa pertama."}
          </p>

          {/* Price block */}
          <div className="inline-flex flex-col items-center bg-card border border-border rounded-2xl px-8 py-6 mb-6 shadow-sm">
            <div className="flex items-center gap-3 mb-1">
              <span className="text-sm text-muted-foreground line-through">{formatRupiah(normalPrice)}</span>
              <span
                className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                style={{ background: pink }}
              >
                HEMAT {discountPct}%
              </span>
            </div>
            <p className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-1">{formatRupiah(PROMO_PRICE)}</p>
            <p className="text-xs text-muted-foreground">Harga khusus {PROMO_QUOTA} siswa pertama</p>
          </div>

          {/* Spots progress */}
          <div className="max-w-sm mx-auto mb-8">
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

          {alreadyHasCourse ? (
            <div className="flex flex-col items-center gap-3">
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

          <div className="flex items-center justify-center gap-5 text-xs text-muted-foreground mt-6 flex-wrap">
            {course.duration_minutes ? (
              <span className="flex items-center gap-1">
                <Clock size={14} /> {Math.round(course.duration_minutes / 60)} jam materi
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
        </div>
      </section>

      {/* Highlights */}
      <section className="max-w-5xl mx-auto px-6 md:px-12 py-16">
        <h2 className="text-center font-serif text-2xl md:text-3xl font-semibold text-foreground mb-10">
          Apa yang Kamu Dapatkan
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {highlights.map(({ icon: Icon, label, desc }) => (
            <div key={label} className="text-center border border-border rounded-xl p-5 bg-card">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center mx-auto mb-3"
                style={{ background: `linear-gradient(135deg, ${pink}22, ${blue}22)` }}
              >
                <Icon size={20} style={{ color: pink }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">{label}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
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

      {/* Instructor */}
      {course.instructor_name && (
        <section className="bg-muted/40 py-14 px-6 md:px-12">
          <div className="max-w-3xl mx-auto flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-card border border-border flex items-center justify-center text-foreground text-lg font-medium shrink-0">
              {course.instructor_name.charAt(0)}
            </div>
            <div>
              <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-1">Instruktur</p>
              <p className="font-serif text-lg font-semibold text-foreground">{course.instructor_name}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Desainer visioner, dikenal lewat karya-karyanya yang berani, ceria, kontemporer, dan kaya sentuhan budaya Indonesia.
              </p>
            </div>
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

      <Footer />

      {/* Sticky mobile CTA */}
      {!alreadyHasCourse && (
        <div className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card border-t border-border p-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] text-muted-foreground line-through leading-none">{formatRupiah(normalPrice)}</p>
            <p className="text-base font-serif font-bold text-foreground leading-tight">{formatRupiah(PROMO_PRICE)}</p>
          </div>
          <Button
            onClick={handleClaim}
            className="flex-1 rounded-full text-xs tracking-[0.1em] uppercase font-semibold"
            style={{ background: `linear-gradient(135deg, ${pink}, ${blue})`, color: "white" }}
          >
            Klaim Promo
          </Button>
        </div>
      )}
    </div>
  );
};

export default PromoFashionDesign;
