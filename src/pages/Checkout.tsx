import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, AlertCircle, AlertTriangle, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import { api, type Order } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, orderStatus, orderItemOf, orderItemTypeLabel } from "@/lib/format";
import { trackPixelEvent, trackPurchaseOnce } from "@/lib/metaPixel";
import { toast } from "sonner";

const Checkout = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const pixelTracked = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      api.get<Order>(`/orders/${orderId}`),
      api.get<{ enabled: boolean }>("/payment-gateway/status").catch(() => ({ enabled: false })),
    ])
      .then(([o, gw]) => {
        setOrder(o);
        setGatewayEnabled(gw.enabled);
        // InitiateCheckout hanya saat order masih berjalan, bukan saat revisit order yang sudah dibayar/ditutup.
        if (!pixelTracked.current && (o.status === "pending" || o.status === "rejected")) {
          pixelTracked.current = true;
          trackPixelEvent("InitiateCheckout", {
            value: o.total_idr,
            currency: "IDR",
            content_ids: o.course_id ? [o.course_id] : undefined,
            content_name: orderItemOf(o)?.title,
            content_type: "product",
            num_items: 1,
          });
        }
        // Purchase: order sudah lunas. De-dup per order_id via localStorage
        // supaya revisit halaman ini tidak mengirim event dobel.
        if (o.status === "paid") {
          trackPurchaseOnce(o.id, {
            value: o.total_idr,
            currency: "IDR",
            content_ids: o.course_id ? [o.course_id] : undefined,
            content_name: orderItemOf(o)?.title,
            content_type: "product",
            num_items: 1,
          });
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Gagal memuat order"))
      .finally(() => setLoading(false));
  }, [orderId]);

  // Order lagi "processing" (charge Mayar sudah dibuat, menunggu webhook) —
  // poll berkala sampai statusnya berubah jadi paid/failed/dst.
  useEffect(() => {
    if (!orderId || !gatewayEnabled || order?.status !== "processing") return;
    const interval = setInterval(() => {
      api.get<Order>(`/orders/${orderId}`).then(setOrder).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [orderId, gatewayEnabled, order?.status]);

  const payWithGateway = async () => {
    if (!order) return;
    setCharging(true);
    try {
      const charge = await api.post<{ redirect_url: string }>(`/payment-gateway/orders/${order.id}/charge`);
      window.location.href = charge.redirect_url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat pembayaran");
      setCharging(false);
    }
  };

  const cancelOrder = async () => {
    if (!order || !confirm("Batalkan pesanan ini?")) return;
    try {
      const updated = await api.post<Order>(`/orders/${order.id}/cancel`);
      setOrder(updated);
      toast.success("Pesanan dibatalkan");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membatalkan");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm">Memuat...</div>
      </div>
    );
  }
  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">Pesanan tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/pesanan">Pesanan Saya</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const st = orderStatus(order.status);
  const isClosed = order.status === "expired" || order.status === "cancelled";
  const canInitiatePayment = ["pending", "rejected", "failed"].includes(order.status);
  // Nomor HP wajib sebelum bisa bayar — akun lama yang dibuat sebelum field ini
  // ada belum tentu punya, jadi blokir aksi bayar sampai mereka menambahkannya.
  const needsPhoneGate = !profile?.phone;

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/pesanan" className="inline-flex items-center gap-2 text-[12px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Pesanan Saya
          </Link>

          <div className="flex items-center justify-between mb-6">
            <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground">Konfirmasi Pembayaran</h1>
            <span className={`text-[11px] tracking-editorial uppercase px-3 py-1 rounded-full ${st.className}`}>{st.label}</span>
          </div>

          {/* Ringkasan */}
          <div className="border border-border rounded-lg p-5 mb-6 flex items-center gap-4">
            <img src={orderItemOf(order)?.cover_image_url ?? ""} alt="" className="w-20 h-14 object-cover rounded bg-muted" />
            <div className="flex-1">
              <p className="font-medium text-foreground">{orderItemOf(order)?.title ?? "Pesanan"}</p>
              <p className="text-xs text-muted-foreground">{orderItemTypeLabel(order.item_type)}{orderItemOf(order)?.category ? ` · ${orderItemOf(order)?.category}` : ""}</p>
            </div>
          </div>

          {/* Status banners */}
          {order.status === "paid" && (
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-6 text-center mb-6">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={28} />
              <p className="font-medium text-foreground">Pembayaran terverifikasi!</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Kelas sudah aktif di akunmu.</p>
              <Button asChild><Link to="/dashboard">Buka Dashboard</Link></Button>
            </div>
          )}
          {order.status === "awaiting_verification" && (
            <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-6 text-center mb-6">
              <Clock className="mx-auto text-blue-500 mb-2" size={28} />
              <p className="font-medium text-foreground">Menunggu verifikasi staff</p>
            </div>
          )}
          {gatewayEnabled && order.status === "processing" && (
            <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-6 text-center mb-6">
              <Loader2 className="mx-auto text-blue-500 mb-2 animate-spin" size={28} />
              <p className="font-medium text-foreground">Menunggu konfirmasi pembayaran</p>
              <p className="text-sm text-muted-foreground mt-1">Halaman ini akan otomatis memperbarui begitu pembayaranmu terkonfirmasi.</p>
            </div>
          )}
          {order.status === "rejected" && (
            <div className="border border-red-500/30 bg-red-500/10 rounded-lg p-5 mb-6">
              <div className="flex items-center gap-2 text-red-500 font-medium mb-1"><AlertCircle size={18} /> Pembayaran ditolak</div>
              <p className="text-sm text-muted-foreground">{order.rejection_reason || "Silakan coba lagi."}</p>
            </div>
          )}
          {isClosed && (
            <div className="border border-border rounded-lg p-6 text-center mb-6">
              <p className="text-muted-foreground mb-4">Pesanan ini {order.status === "expired" ? "kedaluwarsa" : "dibatalkan"}.</p>
              {order.course && <Button asChild><Link to={`/kelas/${order.course.slug}`}>Pesan Ulang</Link></Button>}
              {order.ebook && <Button asChild><Link to={`/ebook/${order.ebook.slug}`}>Pesan Ulang</Link></Button>}
              {order.event && <Button asChild><Link to={`/event/${order.event.slug}`}>Pesan Ulang</Link></Button>}
            </div>
          )}

          {/* Nomor HP belum diisi — blokir aksi bayar sampai ditambahkan */}
          {!isClosed && canInitiatePayment && needsPhoneGate && (
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-6 mb-6 text-center">
              <Phone className="mx-auto text-amber-500 mb-2" size={24} />
              <p className="font-medium text-foreground mb-1">Nomor HP diperlukan</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan nomor HP di akunmu dulu sebelum melanjutkan pembayaran.</p>
              <Button asChild variant="gradient" className="rounded-full">
                <Link to={`/akun?redirect=${encodeURIComponent(`/checkout/${order.id}`)}`}>Tambahkan Nomor HP</Link>
              </Button>
            </div>
          )}

          {/* Bayar via gateway */}
          {!isClosed && !needsPhoneGate && gatewayEnabled && canInitiatePayment && (
            <div className="border border-border rounded-lg p-6 mb-6">
              <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-2">Total Pembayaran</p>
              <p className="text-3xl font-serif font-bold text-foreground mb-1">{formatRupiah(order.total_idr)}</p>
              {order.discount_idr > 0 && (
                <p className="text-xs text-muted-foreground mb-4">
                  Harga {formatRupiah(order.base_price_idr)} − diskon {order.coupon_code ? `(${order.coupon_code}) ` : ""}{formatRupiah(order.discount_idr)}
                </p>
              )}
              <Button onClick={payWithGateway} disabled={charging} variant="gradient" className="w-full rounded-full">
                {charging ? "Menyiapkan pembayaran..." : "Bayar Sekarang"}
              </Button>
            </div>
          )}

          {/* Gateway belum dikonfigurasi — tidak ada jalur pembayaran lain lagi */}
          {!isClosed && !needsPhoneGate && !gatewayEnabled && canInitiatePayment && (
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-6 mb-6 text-center">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={24} />
              <p className="font-medium text-foreground mb-1">Pembayaran sedang tidak tersedia</p>
              <p className="text-sm text-muted-foreground">Silakan coba lagi nanti atau hubungi kami.</p>
            </div>
          )}

          {(order.status === "pending" || order.status === "awaiting_verification") && (
            <button onClick={cancelOrder} className="mt-6 text-xs text-muted-foreground hover:text-red-500 transition-colors">
              Batalkan pesanan
            </button>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Checkout;
