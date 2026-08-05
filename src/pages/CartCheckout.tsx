import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Clock, AlertTriangle, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import SeoHead from "@/components/SeoHead";
import { api, type Order, type OrderGroup } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, orderStatus } from "@/lib/format";
import { trackPixelEvent } from "@/lib/metaPixel";
import { toast } from "sonner";

function orderTitle(o: Order) {
  return o.course?.title ?? o.ebook?.title ?? o.event?.title ?? "Pesanan";
}
function orderCover(o: Order) {
  return o.course?.cover_image_url ?? o.ebook?.cover_image_url ?? o.event?.cover_image_url ?? "";
}

const PAYABLE_STATUSES = ["pending", "rejected", "failed", "processing"];

const CartCheckout = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(false);
  const pixelTracked = useRef(false);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([
      api.get<OrderGroup>(`/orders/group/${groupId}`),
      api.get<{ enabled: boolean }>("/payment-gateway/status").catch(() => ({ enabled: false })),
    ])
      .then(([g, gw]) => {
        setOrders(g.orders);
        setGatewayEnabled(gw.enabled);
        const active = g.orders.filter((o) => PAYABLE_STATUSES.includes(o.status));
        if (!pixelTracked.current && active.length > 0) {
          pixelTracked.current = true;
          trackPixelEvent("InitiateCheckout", {
            value: g.orders.reduce((s, o) => s + o.total_idr, 0),
            currency: "IDR",
            content_ids: g.orders.map((o) => o.course_id).filter(Boolean),
            content_type: "product",
            num_items: g.orders.length,
          });
        }
      })
      .catch((e) => toast.error(e instanceof Error ? e.message : "Gagal memuat pesanan"))
      .finally(() => setLoading(false));
  }, [groupId]);

  // Selama ada order yang "processing" (charge sudah dibuat, menunggu webhook),
  // poll berkala sampai semuanya lunas/gagal.
  useEffect(() => {
    if (!groupId || !gatewayEnabled) return;
    if (!orders.some((o) => o.status === "processing")) return;
    const interval = setInterval(() => {
      api.get<OrderGroup>(`/orders/group/${groupId}`).then((g) => setOrders(g.orders)).catch(() => {});
    }, 4000);
    return () => clearInterval(interval);
  }, [groupId, gatewayEnabled, orders]);

  const payWithGateway = async () => {
    if (!groupId) return;
    setCharging(true);
    try {
      const charge = await api.post<{ redirect_url: string }>(`/payment-gateway/orders/group/${groupId}/charge`);
      window.location.href = charge.redirect_url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal membuat pembayaran");
      setCharging(false);
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

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">Grup pesanan tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/pesanan">Pesanan Saya</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const combinedTotal = orders.reduce((s, o) => s + o.total_idr, 0);
  const allPaid = orders.every((o) => o.status === "paid");
  const payable = orders.filter((o) => PAYABLE_STATUSES.includes(o.status));
  const anyProcessing = orders.some((o) => o.status === "processing");
  const needsPhoneGate = !profile?.phone;

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <SeoHead title="Konfirmasi Pembayaran" />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/pesanan" className="inline-flex items-center gap-2 text-[12px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Pesanan Saya
          </Link>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">Konfirmasi Pembayaran</h1>
          <p className="text-sm text-muted-foreground mb-8">{orders.length} pesanan dalam satu grup, dibayar dalam satu transaksi.</p>

          {allPaid && (
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-6 text-center mb-6">
              <CheckCircle2 className="mx-auto text-emerald-500 mb-2" size={28} />
              <p className="font-medium text-foreground">Semua pembayaran terverifikasi!</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Semua akses sudah aktif di akunmu.</p>
              <Button asChild><Link to="/dashboard">Buka Dashboard</Link></Button>
            </div>
          )}

          {!allPaid && anyProcessing && (
            <div className="border border-blue-500/30 bg-blue-500/10 rounded-lg p-6 text-center mb-6">
              <Loader2 className="mx-auto text-blue-500 mb-2 animate-spin" size={28} />
              <p className="font-medium text-foreground">Menunggu konfirmasi pembayaran</p>
              <p className="text-sm text-muted-foreground mt-1">Halaman ini akan otomatis memperbarui begitu pembayaranmu terkonfirmasi.</p>
            </div>
          )}

          {!allPaid && !anyProcessing && payable.length > 0 && needsPhoneGate && (
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-6 mb-6 text-center">
              <Phone className="mx-auto text-amber-500 mb-2" size={24} />
              <p className="font-medium text-foreground mb-1">Nomor HP diperlukan</p>
              <p className="text-sm text-muted-foreground mb-4">Tambahkan nomor HP di akunmu dulu sebelum melanjutkan pembayaran.</p>
              <Button asChild variant="gradient" className="rounded-full">
                <Link to={`/akun?redirect=${encodeURIComponent(`/checkout-group/${groupId}`)}`}>Tambahkan Nomor HP</Link>
              </Button>
            </div>
          )}

          {!allPaid && !anyProcessing && payable.length > 0 && !needsPhoneGate && gatewayEnabled && (
            <div className="border border-border rounded-lg p-6 mb-6">
              <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-2">Total Pembayaran</p>
              <p className="text-3xl font-serif font-bold text-foreground mb-4">{formatRupiah(payable.reduce((s, o) => s + o.total_idr, 0))}</p>
              <Button onClick={payWithGateway} disabled={charging} variant="gradient" className="w-full rounded-full">
                {charging ? "Menyiapkan pembayaran..." : "Bayar Sekarang"}
              </Button>
            </div>
          )}

          {!allPaid && !anyProcessing && payable.length > 0 && !needsPhoneGate && !gatewayEnabled && (
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-6 mb-6 text-center">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={24} />
              <p className="font-medium text-foreground mb-1">Pembayaran sedang tidak tersedia</p>
              <p className="text-sm text-muted-foreground">Silakan coba lagi nanti atau hubungi kami.</p>
            </div>
          )}

          {/* Rincian per-pesanan */}
          <div className="space-y-3">
            {orders.map((order) => {
              const st = orderStatus(order.status);
              return (
                <div key={order.id} className="border border-border rounded-lg p-4 flex items-center gap-4">
                  <img src={orderCover(order)} alt="" className="w-16 h-12 object-cover rounded bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{orderTitle(order)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.item_type === "course" ? "Kelas" : order.item_type === "ebook" ? "E-Book" : "Event"} · {formatRupiah(order.total_idr)}
                    </p>
                  </div>
                  <span className={`text-[11px] tracking-editorial uppercase px-3 py-1 rounded-full shrink-0 ${st.className}`}>{st.label}</span>
                </div>
              );
            })}
          </div>

          {combinedTotal > 0 && !allPaid && (
            <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
              <Clock size={13} /> Selesaikan pembayaran sebelum pesanan kedaluwarsa.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartCheckout;
