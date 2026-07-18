import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Upload, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { api, type Order, type OrderGroup, type PaymentInfo } from "@/lib/api";
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

// Form bukti per pesanan, memakai endpoint yang sama /orders/:id/proof.
const ProofForm = ({ order, onUpdated }: { order: Order; onUpdated: (o: Order) => void }) => {
  const { profile } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [payerName, setPayerName] = useState(order.payer_name || profile?.full_name || "");
  const [payerBank, setPayerBank] = useState(order.payer_bank || "");
  const [transferDate, setTransferDate] = useState(order.transfer_date || "");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      onUpdated(updated);
      trackPixelEvent("CompleteRegistration", {
        value: updated.total_idr,
        currency: "IDR",
        content_name: orderTitle(updated),
        status: true,
      });
      toast.success("Bukti terkirim. Menunggu verifikasi staff.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim bukti");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-4 border-t border-border pt-4 space-y-3">
      <div className="space-y-2">
        <Label className="text-xs">Bukti Transfer (JPG/PNG/PDF, maks 5 MB)</Label>
        <Input type="file" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label className="text-xs">Nama Pengirim</Label>
          <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label className="text-xs">Bank Pengirim</Label>
          <Input value={payerBank} onChange={(e) => setPayerBank(e.target.value)} placeholder="BCA / Mandiri / ..." required />
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-xs">Tanggal Transfer</Label>
        <Input type="date" value={transferDate} onChange={(e) => setTransferDate(e.target.value)} />
      </div>
      <Button type="submit" size="sm" className="gap-2" disabled={submitting}>
        <Upload size={14} /> {submitting ? "Mengirim..." : "Saya Sudah Transfer"}
      </Button>
    </form>
  );
};

const CartCheckout = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [info, setInfo] = useState<PaymentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const pixelTracked = useRef(false);

  useEffect(() => {
    if (!groupId) return;
    Promise.all([
      api.get<OrderGroup>(`/orders/group/${groupId}`),
      api.get<PaymentInfo>("/payment-info"),
    ])
      .then(([g, i]) => {
        setOrders(g.orders);
        setInfo(i);
        // InitiateCheckout hanya bila masih ada pesanan yang berjalan di grup ini.
        const active = g.orders.filter((o) => o.status === "pending" || o.status === "rejected");
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

  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    toast.success("Disalin");
  };

  const updateOrder = (updated: Order) => {
    setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));
  };

  const combinedTotal = orders.reduce((s, o) => s + o.total_idr, 0);
  const allPaid = orders.length > 0 && orders.every((o) => o.status === "paid");

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

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title="Konfirmasi Pembayaran" />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link to="/pesanan" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Pesanan Saya
          </Link>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-2">Konfirmasi Pembayaran</h1>
          <p className="text-sm text-muted-foreground mb-8">{orders.length} pesanan dalam satu grup. Transfer & unggah bukti untuk masing-masing pesanan.</p>

          {allPaid && (
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-6 text-center mb-6">
              <CheckCircle2 className="mx-auto text-emerald-600 mb-2" size={28} />
              <p className="font-medium text-foreground">Semua pembayaran terverifikasi!</p>
              <p className="text-sm text-muted-foreground mt-1 mb-4">Semua akses sudah aktif di akunmu.</p>
              <Button asChild><Link to="/dashboard">Buka Dashboard</Link></Button>
            </div>
          )}

          {/* Total gabungan */}
          <div className="border border-border rounded-lg p-6 mb-6">
            <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-2">Total Gabungan</p>
            <p className="text-3xl font-serif font-bold text-foreground">{formatRupiah(combinedTotal)}</p>
            <p className="text-xs text-muted-foreground mt-1">Transfer setiap pesanan secara terpisah sesuai nominal masing-masing (termasuk kode unik).</p>

            {info?.bank_accounts?.length ? (
              <>
                <div className="border-t border-border my-5" />
                <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-3">Rekening Tujuan</p>
                <div className="space-y-3">
                  {info.bank_accounts.map((b) => (
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
              </>
            ) : null}
          </div>

          {/* Per-pesanan */}
          <div className="space-y-5">
            {orders.map((order) => {
              const st = orderStatus(order.status);
              const showForm = order.status === "pending" || order.status === "rejected";
              return (
                <div key={order.id} className="border border-border rounded-lg p-5">
                  <div className="flex items-center gap-4">
                    <img src={orderCover(order)} alt="" className="w-16 h-12 object-cover rounded bg-muted shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{orderTitle(order)}</p>
                      <p className="text-xs text-muted-foreground">{order.item_type === "course" ? "Kelas" : order.item_type === "ebook" ? "E-Book" : "Event"}</p>
                    </div>
                    <span className={`text-[10px] tracking-editorial uppercase px-3 py-1 rounded-full shrink-0 ${st.className}`}>{st.label}</span>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-editorial uppercase text-muted-foreground">Nominal Transfer</p>
                      <div className="flex items-center gap-2">
                        <p className="text-lg font-serif font-bold text-foreground">{formatRupiah(order.total_idr)}</p>
                        <button onClick={() => copy(String(order.total_idr))} className="text-muted-foreground hover:text-foreground"><Copy size={14} /></button>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Harga {formatRupiah(order.base_price_idr)} + kode unik <span className="text-accent font-medium">{order.unique_code}</span></p>
                    </div>
                  </div>

                  {order.status === "awaiting_verification" && (
                    <div className="mt-4 border border-blue-500/30 bg-blue-500/10 rounded p-3 flex items-center gap-2 text-sm text-foreground">
                      <Clock size={16} className="text-blue-600" /> Menunggu verifikasi staff.
                    </div>
                  )}
                  {order.status === "paid" && (
                    <div className="mt-4 border border-emerald-500/30 bg-emerald-500/10 rounded p-3 flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 size={16} className="text-emerald-600" /> Pembayaran terverifikasi.
                    </div>
                  )}
                  {order.status === "rejected" && (
                    <div className="mt-4 border border-red-500/30 bg-red-500/10 rounded p-3 text-sm">
                      <div className="flex items-center gap-2 text-red-600 font-medium"><AlertCircle size={16} /> Bukti ditolak</div>
                      <p className="text-muted-foreground mt-1">{order.rejection_reason || "Silakan kirim ulang bukti yang benar."}</p>
                    </div>
                  )}

                  {(order.status === "awaiting_verification" || order.status === "paid") && order.proof_url && (
                    <div className="mt-4">
                      <a href={order.proof_url} target="_blank" rel="noreferrer">
                        <img src={order.proof_url} alt="Bukti transfer" className="max-h-40 rounded border border-border" />
                      </a>
                    </div>
                  )}

                  {showForm && <ProofForm order={order} onUpdated={updateOrder} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CartCheckout;
