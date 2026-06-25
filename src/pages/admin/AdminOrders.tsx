import { useEffect, useState } from "react";
import { X, ExternalLink, Check, Ban } from "lucide-react";
import { api, type Order } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatRupiah, orderStatus, orderItemOf, orderItemTypeLabel } from "@/lib/format";

const FILTERS = [
  { key: "awaiting_verification", label: "Perlu Verifikasi" },
  { key: "paid", label: "Lunas" },
  { key: "rejected", label: "Ditolak" },
  { key: "pending", label: "Menunggu Bayar" },
  { key: "all", label: "Semua" },
];

const AdminOrders = () => {
  const [filter, setFilter] = useState("awaiting_verification");
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [acting, setActing] = useState(false);

  const load = async (status = filter) => {
    setLoading(true);
    try {
      setOrders(await api.get<Order[]>(`/admin/orders?status=${status}`));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const approve = async (o: Order) => {
    if (!confirm(`Setujui pembayaran ${orderItemOf(o)?.title ?? "item"} oleh ${o.user?.email}?`)) return;
    setActing(true);
    try {
      await api.post(`/admin/orders/${o.id}/approve`);
      toast({ title: "Pembayaran disetujui", description: "Enrollment dibuat." });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const reject = async (o: Order) => {
    const reason = prompt("Alasan penolakan:");
    if (!reason) return;
    setActing(true);
    try {
      await api.post(`/admin/orders/${o.id}/reject`, { reason });
      toast({ title: "Pembayaran ditolak" });
      setSelected(null);
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl">Pembayaran</h1>
        <p className="text-muted-foreground text-sm mt-2">Verifikasi pembayaran transfer dari pembeli.</p>
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[10px] tracking-editorial uppercase px-4 py-2 border transition-colors ${
              filter === f.key ? "bg-foreground/10 border-foreground/30 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : orders.length === 0 ? (
        <div className="border border-border/50 p-12 text-center text-muted-foreground text-sm">Tidak ada pesanan.</div>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-4">Kelas / Pembeli</div>
            <div className="col-span-3">Total</div>
            <div className="col-span-3">Status</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>
          {orders.map((o) => {
            const st = orderStatus(o.status);
            return (
              <div key={o.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center text-sm">
                <div className="col-span-4">
                  <p className="text-foreground">{orderItemOf(o)?.title ?? "—"} <span className="text-[10px] text-muted-foreground">({orderItemTypeLabel(o.item_type)})</span></p>
                  <p className="text-[11px] text-muted-foreground">{o.user?.profile?.full_name || o.user?.email}</p>
                </div>
                <div className="col-span-3">
                  <p className="text-foreground">{formatRupiah(o.total_idr)}</p>
                  <p className="text-[11px] text-muted-foreground">kode {o.unique_code}</p>
                </div>
                <div className="col-span-3">
                  <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 rounded-full ${st.className}`}>{st.label}</span>
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button size="sm" variant="outline" className="rounded-none" onClick={() => setSelected(o)}>Detail</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative bg-card border border-border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6">
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"><X size={18} /></button>
            <h2 className="font-serif text-xl font-semibold mb-1">{orderItemOf(selected)?.title ?? "Pesanan"} <span className="text-xs text-muted-foreground">({orderItemTypeLabel(selected.item_type)})</span></h2>
            <p className="text-xs text-muted-foreground mb-4">
              {selected.user?.profile?.full_name || "—"} · {selected.user?.email}
            </p>

            <div className="space-y-1.5 text-sm mb-4">
              <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-medium">{formatRupiah(selected.total_idr)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Harga + kode unik</span><span>{formatRupiah(selected.base_price_idr)} + {selected.unique_code}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Pengirim</span><span>{selected.payer_name || "—"} ({selected.payer_bank || "—"})</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Tgl transfer</span><span>{selected.transfer_date || "—"}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{orderStatus(selected.status).label}</span></div>
              {selected.rejection_reason && (
                <div className="flex justify-between"><span className="text-muted-foreground">Alasan tolak</span><span className="text-red-600">{selected.rejection_reason}</span></div>
              )}
            </div>

            {selected.proof_url ? (
              <a href={selected.proof_url} target="_blank" rel="noreferrer" className="block mb-4">
                <img src={selected.proof_url} alt="Bukti" className="w-full max-h-72 object-contain rounded border border-border bg-muted" />
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1"><ExternalLink size={12} /> Buka bukti</span>
              </a>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">Belum ada bukti transfer diunggah.</p>
            )}

            {selected.status !== "paid" && (
              <div className="flex gap-3">
                <Button className="flex-1 gap-2" disabled={acting} onClick={() => approve(selected)}>
                  <Check size={16} /> Setujui
                </Button>
                <Button variant="outline" className="flex-1 gap-2" disabled={acting} onClick={() => reject(selected)}>
                  <Ban size={16} /> Tolak
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
