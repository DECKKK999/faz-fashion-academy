import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, Lock, PlayCircle, Star, Users, BadgeCheck, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import SeoHead from "@/components/SeoHead";
import { api, ApiError, type LessonPreview as LessonPreviewData } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { formatRupiah, formatDuration, formatCount } from "@/lib/format";
import { PROMO_PRICE_IDR, isPromoCourse } from "@/lib/promo";
import { toast } from "sonner";

// Parse YouTube id dari youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID
function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "v") return parts[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

// Form daftar/masuk inline yang menggantikan area video untuk pengunjung anonim.
// Setelah sukses, AuthContext berubah → halaman memuat ulang data dan video terbuka.
const AuthGate = ({ courseTitle }: { courseTitle: string }) => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"daftar" | "masuk">("daftar");
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "daftar" && form.password.length < 8) {
      toast.error("Kata sandi minimal 8 karakter");
      return;
    }
    setLoading(true);
    try {
      if (mode === "daftar") {
        await signUp(form.email, form.password, form.name, form.phone);
        toast.success("Akun berhasil dibuat — selamat menonton!");
      } else {
        await signIn(form.email, form.password);
        toast.success("Berhasil masuk — selamat menonton!");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memproses");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full rounded-lg border border-border bg-muted/40 px-6 py-8 md:py-10">
      <div className="max-w-sm mx-auto">
        <div className="flex items-center gap-2 mb-1 text-primary">
          <Lock size={16} />
          <p className="text-[11px] tracking-editorial uppercase">Video Gratis</p>
        </div>
        <h2 className="font-serif text-xl font-bold text-foreground mb-1">
          {mode === "daftar" ? "Daftar gratis untuk menonton" : "Masuk untuk menonton"}
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          Buat akun FAZ Academy (gratis) untuk membuka video preview kelas {courseTitle}.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "daftar" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="pv-name">Nama Lengkap</Label>
                <Input id="pv-name" placeholder="Masukkan nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="pv-phone">Nomor HP</Label>
                <Input id="pv-phone" type="tel" inputMode="tel" placeholder="08xxxxxxxxxx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              </div>
            </>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="pv-email">Email</Label>
            <Input id="pv-email" type="email" placeholder="nama@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pv-password">Kata Sandi</Label>
            <Input id="pv-password" type="password" placeholder={mode === "daftar" ? "Minimal 8 karakter" : "Kata sandi"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          <Button type="submit" variant="gradient" className="w-full rounded-full" size="lg" disabled={loading}>
            {loading ? "Memproses..." : mode === "daftar" ? "Daftar & Tonton Gratis" : "Masuk & Tonton"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-4">
          {mode === "daftar" ? (
            <>
              Sudah punya akun?{" "}
              <button type="button" onClick={() => setMode("masuk")} className="text-primary font-medium hover:underline">
                Masuk
              </button>
            </>
          ) : (
            <>
              Belum punya akun?{" "}
              <button type="button" onClick={() => setMode("daftar")} className="text-primary font-medium hover:underline">
                Daftar gratis
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
};

const LessonPreview = () => {
  const { slug, lessonId } = useParams<{ slug: string; lessonId: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { add: addToCart, checkout } = useCart();
  const [data, setData] = useState<LessonPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [buying, setBuying] = useState(false);
  const gateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lessonId) return;
    setLoading(true);
    api
      .get<LessonPreviewData>(`/player/preview/${lessonId}`)
      .then((d) => setData(d))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
        else toast.error(e instanceof Error ? e.message : "Gagal memuat preview");
      })
      .finally(() => setLoading(false));
  }, [lessonId, user?.id]);

  const course = data?.course ?? null;
  const onPromo = isPromoCourse(course?.slug);
  const needsPhoneToPay = !!user && !profile?.phone;
  const currentPath = `/preview/${slug}/${lessonId}`;

  // CTA upsell: user tertarik → langsung ke checkout (add to cart + checkout group),
  // tanpa mampir ke halaman keranjang.
  const handleBuy = async () => {
    if (!course) return;
    if (!user) {
      gateRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.info("Buat akun gratis dulu untuk melanjutkan");
      return;
    }
    if (course.price_idr <= 0) {
      try {
        await api.post("/orders", { course_id: course.id });
        toast.success("Kelas gratis berhasil diambil!");
        navigate("/dashboard");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Gagal memproses pesanan");
      }
      return;
    }
    setBuying(true);
    try {
      await addToCart("course", course.id);
      const group = await checkout();
      navigate(`/checkout-group/${group.order_group_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memproses checkout");
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background relative">
        <GrainOverlay />
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm">Memuat...</div>
      </div>
    );
  }

  if (notFound || !data || !course) {
    return (
      <div className="min-h-screen bg-background relative">
        <GrainOverlay />
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">Video preview tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/kelas">Kembali ke katalog</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { lesson } = data;
  const ytId = lesson.video_url ? youtubeId(lesson.video_url) : null;

  const renderVideo = () => {
    if (lesson.locked) {
      return (
        <div ref={gateRef}>
          <AuthGate courseTitle={course.title} />
        </div>
      );
    }
    if (ytId) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${ytId}`}
            title={lesson.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      );
    }
    if (lesson.video_url) {
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <video controls src={lesson.video_url} className="w-full h-full" />
        </div>
      );
    }
    return (
      <div className="aspect-video w-full rounded-lg border border-border bg-muted/40 flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Pelajaran ini berupa materi bacaan.</p>
      </div>
    );
  };

  const upsellCard = (
    <>
      {course.cover_image_url && (
        <div className="overflow-hidden rounded-lg bg-muted mb-4">
          <img src={course.cover_image_url} alt={course.title} className="w-full h-auto" />
        </div>
      )}
      <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">Full Course</p>
      <p className="font-serif text-lg font-bold text-foreground mb-3">{course.title}</p>
      {onPromo && course.price_idr > 0 ? (
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-muted-foreground line-through">{formatRupiah(course.price_idr)}</span>
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">PROMO</span>
        </div>
      ) : null}
      <p className="text-3xl font-serif font-bold text-foreground mb-1">
        {course.price_idr > 0 ? formatRupiah(onPromo ? PROMO_PRICE_IDR : course.price_idr) : "Gratis"}
      </p>
      <p className="text-xs text-muted-foreground mb-5">Akses selamanya setelah pembayaran terverifikasi.</p>

      {data.access.enrolled ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-500 text-sm">
            <BadgeCheck size={18} /> Kamu sudah memiliki kelas ini
          </div>
          <Button asChild variant="gradient" className="w-full rounded-full" size="lg">
            <Link to={`/belajar/${course.slug}`}>Lanjut Belajar</Link>
          </Button>
        </div>
      ) : needsPhoneToPay && course.price_idr > 0 ? (
        <Button asChild variant="gradient" className="w-full rounded-full gap-2" size="lg">
          <Link to={`/akun?redirect=${encodeURIComponent(currentPath)}`}>
            <Phone size={16} /> Tambahkan Nomor HP untuk Membayar
          </Link>
        </Button>
      ) : (
        <Button onClick={handleBuy} variant="gradient" className="w-full rounded-full" size="lg" disabled={buying}>
          {buying ? "Memproses..." : course.price_idr > 0 ? "Beli Full Course" : "Ambil Kelas (Gratis)"}
        </Button>
      )}

      <ul className="mt-5 space-y-2 text-xs text-muted-foreground">
        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Akses materi penuh</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Sertifikat penyelesaian</li>
        <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Pembayaran online otomatis</li>
      </ul>

      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap mt-5 pt-4 border-t border-border">
        {course.duration_minutes ? <span className="flex items-center gap-1"><Clock size={13} /> {formatDuration(course.duration_minutes)}</span> : null}
        <span className="flex items-center gap-1"><Users size={13} /> {formatCount(course.students_count)} siswa</span>
        {course.rating ? <span className="flex items-center gap-1"><Star size={13} className="text-gold" /> {course.rating}</span> : null}
      </div>

      <Link to={`/kelas/${course.slug}`} className="block text-center text-xs text-primary hover:underline mt-4">
        Lihat detail lengkap kelas
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <SeoHead
        title={`Preview Gratis: ${lesson.title} — ${course.title}`}
        description={course.subtitle ?? course.description ?? undefined}
        image={course.cover_image_url ?? undefined}
      />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <Link to={`/kelas/${course.slug}`} className="inline-flex items-center gap-2 text-[12px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> {course.title}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main pane: video / auth gate */}
            <div className="lg:col-span-2 order-1">
              <div className="flex items-center gap-2 mb-2 text-primary">
                <PlayCircle size={15} />
                <p className="text-[11px] tracking-editorial uppercase">Preview Gratis</p>
              </div>
              <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-5">{lesson.title}</h1>

              {renderVideo()}

              {!lesson.locked && lesson.content && (
                <div className="prose prose-sm max-w-none mt-6">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{lesson.content}</p>
                </div>
              )}

              {data.other_previews.length > 0 && (
                <div className="mt-8">
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-3">Preview Gratis Lainnya</p>
                  <div className="space-y-2">
                    {data.other_previews.map((p) => (
                      <Link
                        key={p.id}
                        to={`/preview/${course.slug}/${p.id}`}
                        className="flex items-center justify-between gap-3 border border-border rounded-lg px-4 py-3 hover:border-primary/50 transition-colors"
                      >
                        <span className="flex items-center gap-2 text-sm text-foreground">
                          <PlayCircle size={15} className="text-primary shrink-0" /> {p.title}
                        </span>
                        {p.duration_minutes ? (
                          <span className="text-xs text-muted-foreground shrink-0">{p.duration_minutes} mnt</span>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Ajakan setelah menonton — teks jembatan menuju kartu upsell */}
              {!lesson.locked && !data.access.enrolled && (
                <div className="mt-8 border border-primary/30 bg-primary/5 rounded-xl px-5 py-4">
                  <p className="text-sm font-medium text-foreground mb-1">Suka dengan materinya?</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    Ini baru sebagian kecil. Buka semua materi{course.duration_minutes ? ` (${formatDuration(course.duration_minutes)})` : ""}, final quiz, dan sertifikat resmi dengan membeli full course-nya.
                  </p>
                  <Button onClick={handleBuy} variant="gradient" size="sm" className="rounded-full px-6" disabled={buying}>
                    {buying ? "Memproses..." : course.price_idr > 0 ? `Beli Full Course — ${formatRupiah(onPromo ? PROMO_PRICE_IDR : course.price_idr)}` : "Ambil Kelas (Gratis)"}
                  </Button>
                </div>
              )}
            </div>

            {/* Upsell card */}
            <div className="lg:col-span-1 order-2">
              <div className="glass-panel rounded-2xl p-6 lg:sticky lg:top-24 shadow-lg">{upsellCard}</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default LessonPreview;
