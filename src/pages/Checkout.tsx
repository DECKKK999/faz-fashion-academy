import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Upload, Clock, CheckCircle2, AlertCircle, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import { api, type Order, type PaymentInfo } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah, orderStatus, orderItemOf, orderItemTypeLabel } from "@/lib/format";
import { trackPixelEvent, trackPurchaseOnce } from "@/lib/metaPixel";
import { toast } from "sonner";

const Checkout = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [gatewayEnabled, setGatewayEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [charging, setCharging] = useState(false);

  const [file, setFile] = useState<File | null>(null);
  const [payerName, setPayerName] = useState("");
  const [payerBank, setPayerBank] = useState("");
  const [transferDate, setTransferDate] = useState("");
  const pixelTracked = useRef(false);

  useEffect(() => {
    if (!orderId) return;
    Promise.all([
      api.get<Order>(`/orders/${orderId}`),
      api.get<PaymentInfo>("/payment-info"),
      api.get<{ enabled: boolean }>("/payment-gateway/status").catch(() => ({ enabled: false })),
    ])
      .then(([o, i, gw]) => {
        setOrder(o);
        setInfo(i);
        setGatewayEnabled(gw.enabled);
        setPayerName((prev) => prev || o.payer_name || profile?.full_name || "");
        setPayerBank((prev) => prev || o.payer_bank || "");
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
        // Purchase: order sudah diverifikasi admin. De-dup per order_id via localStorage
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
  }, [orderId, profile]);

  // Order lagi "processing" (charge DOKU sudah dibuat, menunggu webhook) —
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

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Disalin");
  };

  const submitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!file) return toast.error("Unggah bukti transfer dulu");
    if (!payerName.trim() || !payerBank.trim()) return toast.error("Lengkapi nama & bank pengirim");
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("proof", file);
      fd.append("payer_name", payerName);
      fd.append("payer_bank", payerBank);
      fd.append("transfer_date", transferDate);
      const updated = await api.upload<Order>(`/orders/${order.id}/proof`, fd);
      setOrder(updated);
      trackPixelEvent("CompleteRegistration", {
        value: updated.total_idr,
        currency: "IDR",
        content_name: orderItemOf(updated)?.title,
        status: true,
      });
      toast.success("Bukti terkirim. Menunggu verifikasi staff.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim bukti");
    } finally {
      setSubmitting(false);
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
  const showForm = order.status === "pending" || order.status === "rejected";
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
              <p className="text-sm text-muted-foreground mt-1">Bukti transfer sudah kami terima. Verifikasi maksimal 1x24 jam kerja.</p>
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
              <div className="flex items-center gap-2 text-red-500 font-medium mb-1"><AlertCircle size={18} /> Bukti ditolak</div>
              <p className="text-sm text-muted-foreground">{order.rejection_reason || "Silakan kirim ulang bukti transfer yang benar."}</p>
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

          {/* Bayar via DOKU */}
          {!isClosed && !needsPhoneGate && gatewayEnabled && ["pending", "rejected", "failed"].includes(order.status) && (
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

          {/* Instruksi pembayaran + total (transfer manual) */}
          {!isClosed && !needsPhoneGate && !gatewayEnabled && order.status !== "paid" && (
            <>
              <div className="border border-border rounded-lg p-6 mb-6">
                <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-2">Total Pembayaran</p>
                <div className="flex items-end gap-3 mb-1">
                  <p className="text-3xl font-serif font-bold text-foreground">{formatRupiah(order.total_idr)}</p>
                  <button onClick={() => copy(String(order.total_idr))} className="mb-1.5 text-muted-foreground hover:text-foreground"><Copy size={16} /></button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Harga {formatRupiah(order.base_price_idr)}
                  {order.discount_idr > 0 && (
                    <> − diskon {order.coupon_code ? `(${order.coupon_code}) ` : ""}{formatRupiah(order.discount_idr)}</>
                  )}
                  {" "}+ kode unik <span className="font-medium text-accent">{order.unique_code}</span>.
                  Transfer <span className="font-medium">tepat</span> sampai 3 digit terakhir.
                </p>

                <div className="border-t border-border my-5" />
                <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-3">Rekening Tujuan</p>
                <div className="space-y-3">
                  {info?.bank_accounts.map((b) => (
                    <div key={b.bank} className="flex items-center justify-between border border-border/60 rounded p-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{b.bank}</p>
                        <p className="text-sm text-foreground">{b.account_number}</p>
                        <p className="text-xs text-muted-foreground">a.n. {b.account_name}</p>
                      </div>
                      <button onClick={() => copy(b.account_number)} className="text-muted-foreground hover:text-foreground"><Copy size={16} /></button>
                    </div>
                  ))}
                </div>

                {info?.instructions?.length ? (
                  <ul className="mt-5 space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
                    {info.instructions.map((ins, i) => <li key={i}>{ins}</li>)}
                  </ul>
                ) : null}
              </div>

              {/* Form bukti */}
              {showForm && (
                <form onSubmit={submitProof} className="border border-border rounded-lg p-6 space-y-4">
                  <h2 className="font-serif text-lg font-semibold text-foreground">Konfirmasi Transfer</h2>
                  <div className="space-y-2">
                    <Label>Bukti Transfer (JPG/PNG/PDF, maks 5 MB)</Label>
                    <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nama Pengirim</Label>
                      <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label>Bank Pengirim</Label>
                      <Input value={payerBank} onChange={(e) => setPayerBank(e.target.value)} placeholder="BCA / Mandiri / ..." required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tanggal Transfer</Label>
                    <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
                  </div>
                  <Button type="submit" variant="gradient" className="w-full rounded-full gap-2" disabled={submitting}>
                    <Upload size={16} /> {submitting ? "Mengirim..." : "Saya Sudah Transfer"}
                  </Button>
                </form>
              )}
            </>
          )}

          {/* Bukti yang sudah dikirim */}
          {(order.status === "awaiting_verification" || order.status === "paid") && order.proof_url && (
            <div className="border border-border rounded-lg p-5 mt-6">
              <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-3">Bukti Terkirim</p>
              <div className="text-xs text-muted-foreground mb-3">
                <p>Pengirim: {order.payer_name} ({order.payer_bank})</p>
                {order.transfer_date && <p>Tanggal: {order.transfer_date}</p>}
              </div>
              <a href={order.proof_url} target="_blank" rel="noreferrer" className="inline-block">
                <img src={order.proof_url} alt="Bukti transfer" className="max-h-48 rounded border border-border" />
              </a>
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
