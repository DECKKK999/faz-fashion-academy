import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ShoppingBag, AlertTriangle, Plus, Phone, CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import PageHeader from "@/components/PageHeader";
import SeoHead from "@/components/SeoHead";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import type { ProductType, CouponValidation } from "@/lib/api";
import { PROMO_COURSE_SLUG, PROMO_COUPON_CODE } from "@/lib/promo";

const typeLabel: Record<ProductType, string> = { course: "Kelas", ebook: "E-Book", event: "Event" };

function detailPath(product_type: ProductType, slug?: string) {
  if (!slug) return undefined;
  if (product_type === "course") return `/kelas/${slug}`;
  if (product_type === "ebook") return `/ebook/${slug}`;
  return `/event/${slug}`;
}

// Halaman ini berperan ganda: lihat/ubah isi keranjang DAN jadi langkah checkout
// terakhir (cek pesanan, kode kupon, bayar) — baik untuk satu kelas maupun banyak.
const Cart = () => {
  const { items, total_idr, loading, remove, checkout } = useCart();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  // null = belum dicek/berubah sejak dicek terakhir; angka = total diskon yang berhasil diverifikasi.
  const [couponDiscount, setCouponDiscount] = useState<number | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const autoAppliedRef = useRef(false);

  useEffect(() => {
    api.get<{ enabled: boolean }>("/payment-gateway/status").then((gw) => setGatewayEnabled(gw.enabled)).catch(() => {});
  }, []);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await remove(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus item");
    } finally {
      setRemoving(null);
    }
  };

  const needsPhoneGate = !profile?.phone;

  const onCouponInputChange = (value: string) => {
    setCouponCode(value);
    // Kode berubah — hasil verifikasi sebelumnya sudah tidak relevan.
    setCouponDiscount(null);
    setCouponError(null);
  };

  // Cek kode kupon terhadap tiap item kelas di keranjang (kupon bisa spesifik
  // per kelas atau global), lalu jumlahkan diskon dari item yang cocok — sama
  // seperti cara backend menerapkannya saat checkout sungguhan.
  const applyCoupon = async (code: string, opts?: { silent?: boolean }) => {
    setApplyingCoupon(true);
    if (!opts?.silent) setCouponError(null);
    try {
      const courseItems = items.filter((i) => i.product_type === "course");
      if (courseItems.length === 0) {
        if (!opts?.silent) {
          setCouponDiscount(0);
          setCouponError("Kupon hanya berlaku untuk kelas");
        }
        return;
      }
      const results = await Promise.all(
        courseItems.map((i) =>
          api.post<CouponValidation>("/coupons/validate", { code, course_id: i.product_id }).catch(
            (): CouponValidation => ({ valid: false, code, discount_idr: 0, base_price_idr: i.price_idr, total_preview_idr: i.price_idr, reason: "Gagal memeriksa kupon" })
          )
        )
      );
      const totalDiscount = results.reduce((s, r) => s + (r.valid ? r.discount_idr : 0), 0);
      if (totalDiscount > 0) {
        setCouponDiscount(totalDiscount);
        if (!opts?.silent) toast.success("Kupon berhasil diterapkan");
      } else if (opts?.silent) {
        // Promo otomatis gagal (mis. kuota habis) — jangan tampilkan kode/error,
        // biar pembeli tidak bingung dengan kupon yang kelihatan setengah ter-apply.
        setCouponCode("");
      } else {
        setCouponDiscount(0);
        setCouponError(results.find((r) => !r.valid)?.reason || "Kode kupon tidak valid");
      }
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleApplyCoupon = () => {
    const code = couponCode.trim();
    if (!code) return;
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent("/keranjang")}`);
      return;
    }
    applyCoupon(code);
  };

  // Promo peluncuran kelas fashion design berlaku otomatis, sama seperti saat
  // checkout langsung — jangan sampai pembeli lupa mengetik kode kupon-nya
  // sendiri dan mengira harga masih penuh.
  useEffect(() => {
    if (autoAppliedRef.current) return;
    if (!user || loading || items.length === 0) return;
    const eligible = items.some((i) => i.product_type === "course" && i.slug === PROMO_COURSE_SLUG);
    if (!eligible) return;
    autoAppliedRef.current = true;
    setCouponCode(PROMO_COUPON_CODE);
    applyCoupon(PROMO_COUPON_CODE, { silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading, items]);

  const handleCheckout = async () => {
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent("/keranjang")}`);
      return;
    }
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const group = await checkout(couponCode.trim() || undefined);
      if (!group.order_group_id || group.orders.length === 0) {
        // Semua item gratis / langsung diberikan.
        toast.success("Akses berhasil diberikan!");
        navigate("/dashboard");
        return;
      }
      try {
        const charge = await api.post<{ redirect_url: string }>(`/payment-gateway/orders/group/${group.order_group_id}/charge`);
        window.location.href = charge.redirect_url;
      } catch (e) {
        // Order sudah dibuat tapi charge gagal — jangan biarkan pembeli terjebak,
        // arahkan ke halaman status supaya bisa coba lagi dari sana.
        toast.error(e instanceof Error ? e.message : "Gagal membuat pembayaran");
        navigate(`/checkout-group/${group.order_group_id}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memproses checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  const hasStale = items.some((i) => i.stale_price);

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <SeoHead title="Checkout" description="Checkout FAZ Academy." />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/kelas" className="inline-flex items-center gap-2 text-[12px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Lanjut Belanja
          </Link>

          <PageHeader kicker="Belanja" title="Checkout" />

          {loading ? (
            <p className="text-muted-foreground text-sm">Memuat...</p>
          ) : items.length === 0 ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <ShoppingBag className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground mb-5">Keranjang kamu masih kosong.</p>
              <Button asChild><Link to="/kelas">Jelajahi Kelas</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  const path = detailPath(item.product_type, item.slug);
                  return (
                    <div key={item.id} className="border border-border rounded-lg p-4 flex items-center gap-4">
                      <img src={item.cover_snapshot ?? ""} alt="" className="w-20 h-14 object-cover rounded bg-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">{typeLabel[item.product_type]}</span>
                        {path ? (
                          <Link to={path} className="block font-medium text-foreground hover:text-accent transition-colors truncate">{item.title_snapshot}</Link>
                        ) : (
                          <p className="font-medium text-foreground truncate">{item.title_snapshot}</p>
                        )}
                        <p className="text-sm text-accent mt-1">{item.price_idr > 0 ? formatRupiah(item.price_idr) : "Gratis"}</p>
                        {item.stale_price && (
                          <p className="text-[11px] text-amber-500 mt-1 flex items-center gap-1">
                            <AlertTriangle size={11} /> Harga telah diperbarui
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing === item.id}
                        aria-label="Hapus"
                        className="text-muted-foreground hover:text-red-500 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}

                <Button asChild variant="outline" className="w-full gap-2 rounded-full">
                  <Link to="/kelas"><Plus size={15} /> Tambah Kelas Lain</Link>
                </Button>
              </div>

              {/* Ringkasan + checkout */}
              <div className="lg:col-span-1">
                <div className="glass-panel rounded-2xl p-6 sticky top-24 shadow-lg">
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-4">Ringkasan</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{items.length} item</span>
                    <span className="text-foreground">{formatRupiah(total_idr)}</span>
                  </div>
                  <div className="border-t border-border my-4" />

                  <div className="space-y-2 mb-4">
                    <Label htmlFor="coupon" className="text-xs">Kode Kupon (opsional)</Label>
                    <div className="flex gap-2">
                      <Input
                        id="coupon"
                        value={couponCode}
                        onChange={(e) => onCouponInputChange(e.target.value)}
                        placeholder="Masukkan kode"
                        className="uppercase"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={applyingCoupon || !couponCode.trim()}
                      >
                        {applyingCoupon ? <Loader2 size={15} className="animate-spin" /> : "Terapkan"}
                      </Button>
                    </div>
                    {couponDiscount != null && couponDiscount > 0 && (
                      <p className="text-[12px] text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 size={13} /> Kupon diterapkan — hemat {formatRupiah(couponDiscount)}
                      </p>
                    )}
                    {couponError && (
                      <p className="text-[12px] text-red-500 flex items-center gap-1">
                        <XCircle size={13} /> {couponError}
                      </p>
                    )}
                  </div>

                  {couponDiscount != null && couponDiscount > 0 ? (
                    <>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="text-foreground">{formatRupiah(total_idr)}</span>
                      </div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">Diskon kupon</span>
                        <span className="text-emerald-600">−{formatRupiah(couponDiscount)}</span>
                      </div>
                      <div className="flex justify-between items-end mb-4">
                        <span className="text-sm text-muted-foreground">Total</span>
                        <span className="text-xl font-serif font-bold text-foreground">{formatRupiah(Math.max(0, total_idr - couponDiscount))}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-end mb-4">
                      <span className="text-sm text-muted-foreground">Subtotal</span>
                      <span className="text-xl font-serif font-bold text-foreground">{formatRupiah(total_idr)}</span>
                    </div>
                  )}
                  {hasStale && (
                    <p className="text-[12px] text-amber-500 mb-3 flex items-center gap-1">
                      <AlertTriangle size={12} /> Beberapa harga telah berubah.
                    </p>
                  )}

                  {user && needsPhoneGate ? (
                    <Button asChild variant="gradient" className="w-full rounded-full gap-2">
                      <Link to={`/akun?redirect=${encodeURIComponent("/keranjang")}`}><Phone size={15} /> Tambahkan Nomor HP</Link>
                    </Button>
                  ) : user && !gatewayEnabled ? (
                    <div className="text-center">
                      <p className="text-xs text-amber-500 mb-2 flex items-center justify-center gap-1">
                        <AlertTriangle size={12} /> Pembayaran sedang tidak tersedia
                      </p>
                      <Button variant="gradient" className="w-full rounded-full" disabled>Checkout</Button>
                    </div>
                  ) : (
                    <Button variant="gradient" className="w-full rounded-full" onClick={handleCheckout} disabled={checkingOut || items.length === 0}>
                      {checkingOut ? "Memproses..." : "Checkout"}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
