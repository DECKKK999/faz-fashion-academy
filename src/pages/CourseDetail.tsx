import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Clock, Users, Star, ArrowLeft, CheckCircle2, BadgeCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type Course, type PurchaseState } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, formatDuration, formatCount } from "@/lib/format";
import { PROMO_COUPON_CODE, PROMO_PRICE_IDR, isPromoCourse } from "@/lib/promo";
import CourseReviews from "@/components/course/CourseReviews";
import WishlistButton from "@/components/WishlistButton";
import SeoHead from "@/components/SeoHead";
import { toast } from "sonner";

const CourseDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [state, setState] = useState<PurchaseState>({ enrolled: false, order: null });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Course>(`/courses/slug/${slug}`)
      .then(async (c) => {
        setCourse(c);
        try {
          setState(await api.get<PurchaseState>(`/courses/${c.id}/purchase-state`));
        } catch {
          /* anon */
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug, user]);

  const onPromo = isPromoCourse(course?.slug);

  const handleBuy = () => {
    if (!course) return;
    const target = onPromo ? `/beli/${course.id}?coupon=${PROMO_COUPON_CODE}` : `/beli/${course.id}`;
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent(target)}`);
      return;
    }
    navigate(target);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm">Memuat...</div>
      </div>
    );
  }

  if (notFound || !course) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">Kelas tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/kelas">Kembali ke katalog</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const order = state.order;
  const renderCta = () => {
    if (state.enrolled) {
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 text-sm">
            <BadgeCheck size={18} /> Kamu sudah memiliki kelas ini
          </div>
          <Button asChild className="w-full" size="lg"><Link to={`/belajar/${course.slug}`}>Mulai Belajar</Link></Button>
        </div>
      );
    }
    if (order && (order.status === "pending" || order.status === "awaiting_verification")) {
      return (
        <Button asChild className="w-full" size="lg">
          <Link to={`/checkout/${order.id}`}>
            {order.status === "pending" ? "Lanjutkan Pembayaran" : "Lihat Status Pembayaran"}
          </Link>
        </Button>
      );
    }
    if (order && order.status === "rejected") {
      return (
        <Button asChild className="w-full" size="lg">
          <Link to={`/checkout/${order.id}`}>Kirim Ulang Bukti</Link>
        </Button>
      );
    }
    return (
      <Button onClick={handleBuy} className="w-full" size="lg">
        {course.price_idr > 0 ? "Beli Kelas" : "Ambil Kelas (Gratis)"}
      </Button>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title={`${course.title} — FAZ Academy`} description={course.subtitle ?? course.description ?? undefined} image={course.cover_image_url ?? undefined} />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/kelas" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Katalog Kelas
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-lg bg-muted mb-6">
                <img src={course.cover_image_url ?? ""} alt={course.title} className="w-full h-auto" />
              </div>
              <div className="flex items-center gap-2 mb-3">
                {course.category && (
                  <span className="text-[10px] tracking-editorial uppercase bg-primary/10 text-primary px-3 py-1 rounded-full">{course.category}</span>
                )}
                {course.level && (
                  <span className="text-[10px] tracking-editorial uppercase border border-border px-3 py-1 rounded-full text-muted-foreground">{course.level}</span>
                )}
              </div>
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">{course.title}</h1>
              {course.subtitle && <p className="text-muted-foreground mb-4">{course.subtitle}</p>}

              <div className="flex items-center gap-5 text-xs text-muted-foreground mb-8">
                {course.duration_minutes ? <span className="flex items-center gap-1"><Clock size={14} /> {formatDuration(course.duration_minutes)}</span> : null}
                <span className="flex items-center gap-1"><Users size={14} /> {formatCount(course.students_count)} siswa</span>
                {course.rating ? <span className="flex items-center gap-1"><Star size={14} className="text-gold" /> {course.rating}</span> : null}
              </div>

              {course.description && (() => {
                const paragraphs = course.description.split(/\n\s*\n/);
                const hasMore = paragraphs.length > 1;
                return (
                  <div className="prose prose-sm max-w-none">
                    <h2 className="font-serif text-xl font-semibold text-foreground mb-3">Tentang Kelas</h2>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                      {descExpanded ? course.description : paragraphs[0]}
                    </p>
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => setDescExpanded((v) => !v)}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                      >
                        {descExpanded ? "Lihat lebih sedikit" : "Lihat lebih"}
                      </button>
                    )}
                  </div>
                );
              })()}

              {course.instructor_name && (
                <div className="mt-8 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-foreground text-sm font-medium">
                    {course.instructor_name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] tracking-editorial uppercase text-muted-foreground">Instruktur</p>
                    <p className="text-sm text-foreground">{course.instructor_name}</p>
                  </div>
                </div>
              )}

              <div className="mt-10 border-t border-border pt-8">
                <CourseReviews courseId={course.id} canReview={state.enrolled} />
              </div>
            </div>

            {/* Purchase card */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-lg p-6 sticky top-24 bg-card">
                {onPromo && course.price_idr > 0 ? (
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm text-muted-foreground line-through">{formatRupiah(course.price_idr)}</span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">PROMO</span>
                  </div>
                ) : null}
                <p className="text-3xl font-serif font-bold text-foreground mb-1">
                  {course.price_idr > 0 ? formatRupiah(onPromo ? PROMO_PRICE_IDR : course.price_idr) : "Gratis"}
                </p>
                <p className="text-xs text-muted-foreground mb-6">
                  {onPromo ? "Harga khusus 100 siswa pertama. " : ""}Akses selamanya setelah pembayaran terverifikasi.
                </p>
                {renderCta()}
                <div className="mt-3">
                  <WishlistButton product_type="course" product_id={course.id} variant="full" className="w-full px-4 py-2" />
                </div>
                <ul className="mt-6 space-y-2 text-xs text-muted-foreground">
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Akses materi penuh</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Sertifikat penyelesaian</li>
                  <li className="flex items-center gap-2"><CheckCircle2 size={14} className="text-accent" /> Pembayaran transfer bank</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseDetail;
