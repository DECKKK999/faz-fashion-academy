import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Ticket, Users } from "lucide-react";
import { api, type Coupon, type Course, type DiscountType, type Order } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { formatRupiah, orderStatus } from "@/lib/format";

// Redemption shape returned by GET /api/admin/coupons/:id/redemptions
type Redemption = {
  id: string;
  discount_idr: number;
  created_at: string;
  user: { id: string; email: string; profile: { full_name: string | null } | null };
  order: Pick<Order, "id" | "status" | "total_idr" | "base_price_idr" | "created_at" | "item_type"> | null;
};

type FormState = {
  code: string;
  description: string;
  discount_type: DiscountType;
  discount_value: string;
  course_id: string; // "global" = scope global
  max_uses: string;
  max_discount_idr: string;
  min_purchase_idr: string;
  expires_at: string; // datetime-local value
  is_active: boolean;
};

const GLOBAL = "global";

const emptyForm: FormState = {
  code: "",
  description: "",
  discount_type: "percentage",
  discount_value: "",
  course_id: GLOBAL,
  max_uses: "",
  max_discount_idr: "",
  min_purchase_idr: "",
  expires_at: "",
  is_active: true,
};

// Convert ISO string to a value usable by <input type="datetime-local">
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function discountLabel(c: Coupon): string {
  return c.discount_type === "percentage" ? `${c.discount_value}%` : formatRupiah(c.discount_value);
}

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  // Redemptions dialog
  const [redemptionOpen, setRedemptionOpen] = useState(false);
  const [redemptionCoupon, setRedemptionCoupon] = useState<Coupon | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redemptionLoading, setRedemptionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [c, courseList] = await Promise.all([
        api.get<Coupon[]>("/admin/coupons"),
        api.get<Course[]>("/courses"),
      ]);
      setCoupons(c);
      setCourses(courseList);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setEditorOpen(true);
  };

  const openEdit = (c: Coupon) => {
    setEditingId(c.id);
    setForm({
      code: c.code,
      description: c.description ?? "",
      discount_type: c.discount_type,
      discount_value: String(c.discount_value),
      course_id: c.course_id ?? GLOBAL,
      max_uses: c.max_uses != null ? String(c.max_uses) : "",
      max_discount_idr: c.max_discount_idr != null ? String(c.max_discount_idr) : "",
      min_purchase_idr: c.min_purchase_idr != null ? String(c.min_purchase_idr) : "",
      expires_at: toLocalInput(c.expires_at),
      is_active: c.is_active,
    });
    setEditorOpen(true);
  };

  const numOrNull = (s: string): number | null => {
    const t = s.trim();
    if (t === "") return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };

  const handleSave = async () => {
    if (!form.code.trim()) {
      toast({ title: "Error", description: "Kode wajib diisi", variant: "destructive" });
      return;
    }
    const discountValue = Number(form.discount_value);
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      toast({ title: "Error", description: "Nilai diskon harus lebih dari 0", variant: "destructive" });
      return;
    }
    if (form.discount_type === "percentage" && (discountValue < 1 || discountValue > 100)) {
      toast({ title: "Error", description: "Diskon persentase harus antara 1 dan 100", variant: "destructive" });
      return;
    }

    const payload = {
      code: form.code.trim().toUpperCase(),
      description: form.description.trim() || null,
      discount_type: form.discount_type,
      discount_value: discountValue,
      course_id: form.course_id === GLOBAL ? null : form.course_id,
      max_uses: numOrNull(form.max_uses),
      max_discount_idr: numOrNull(form.max_discount_idr),
      min_purchase_idr: numOrNull(form.min_purchase_idr),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active: form.is_active,
    };

    setSaving(true);
    try {
      if (editingId) {
        await api.patch(`/admin/coupons/${editingId}`, payload);
        toast({ title: "Kupon diperbarui" });
      } else {
        await api.post("/admin/coupons", payload);
        toast({ title: "Kupon dibuat" });
      }
      setEditorOpen(false);
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus kupon ini? Riwayat redemption juga akan terhapus.")) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      toast({ title: "Kupon dihapus" });
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menghapus", variant: "destructive" });
    }
  };

  const openRedemptions = async (c: Coupon) => {
    setRedemptionCoupon(c);
    setRedemptionOpen(true);
    setRedemptionLoading(true);
    setRedemptions([]);
    try {
      setRedemptions(await api.get<Redemption[]>(`/admin/coupons/${c.id}/redemptions`));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setRedemptionLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl">Kupon</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Kelola kode promo untuk kelas. Kupon berlaku saat pembuatan order kelas.
          </p>
        </div>
        <Button onClick={openCreate} className="rounded-none gap-2">
          <Plus size={14} /> Kupon Baru
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : coupons.length === 0 ? (
        <div className="border border-border/50 p-12 text-center">
          <Ticket size={28} className="mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground mb-4">Belum ada kupon.</p>
          <Button onClick={openCreate} className="rounded-none">Buat kupon pertama</Button>
        </div>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-3">Kode</div>
            <div className="col-span-2">Diskon</div>
            <div className="col-span-3">Cakupan</div>
            <div className="col-span-1">Dipakai</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Aksi</div>
          </div>
          {coupons.map((c) => (
            <div key={c.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center text-sm">
              <div className="col-span-3">
                <p className="text-foreground font-mono uppercase">{c.code}</p>
                {c.description && <p className="text-[11px] text-muted-foreground line-clamp-1">{c.description}</p>}
              </div>
              <div className="col-span-2 text-muted-foreground">
                {discountLabel(c)}
                {c.max_discount_idr != null && c.discount_type === "percentage" && (
                  <span className="block text-[10px]">maks {formatRupiah(c.max_discount_idr)}</span>
                )}
              </div>
              <div className="col-span-3 text-muted-foreground">{c.course?.title ?? "Semua kelas (Global)"}</div>
              <div className="col-span-1 text-muted-foreground">
                {c.used_count}
                {c.max_uses != null && <span className="text-[10px]">/{c.max_uses}</span>}
              </div>
              <div className="col-span-1">
                <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 ${c.is_active ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}>
                  {c.is_active ? "Aktif" : "Nonaktif"}
                </span>
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <Button size="sm" variant="ghost" title="Lihat redemption" onClick={() => openRedemptions(c)}>
                  <Users size={14} />
                </Button>
                <Button size="sm" variant="ghost" title="Ubah" onClick={() => openEdit(c)}>
                  <Pencil size={14} />
                </Button>
                <Button size="sm" variant="ghost" title="Hapus" className="hover:text-red-600" onClick={() => handleDelete(c.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Ubah Kupon" : "Kupon Baru"}</DialogTitle>
            <DialogDescription>Kode akan disimpan dalam huruf kapital.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-[10px] tracking-editorial uppercase">Kode</Label>
              <Input
                value={form.code}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
                className="mt-1.5 font-mono uppercase"
                placeholder="DISKON20"
              />
            </div>

            <div>
              <Label className="text-[10px] tracking-editorial uppercase">Deskripsi</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setField("description", e.target.value)}
                className="mt-1.5"
                rows={2}
                placeholder="Promo akhir tahun"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] tracking-editorial uppercase">Tipe Diskon</Label>
                <Select value={form.discount_type} onValueChange={(v) => setField("discount_type", v as DiscountType)}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Persentase (%)</SelectItem>
                    <SelectItem value="fixed">Nominal (Rp)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] tracking-editorial uppercase">
                  {form.discount_type === "percentage" ? "Nilai (%)" : "Nilai (Rp)"}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.discount_value}
                  onChange={(e) => setField("discount_value", e.target.value)}
                  className="mt-1.5"
                  placeholder={form.discount_type === "percentage" ? "20" : "50000"}
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] tracking-editorial uppercase">Cakupan Kelas</Label>
              <Select value={form.course_id} onValueChange={(v) => setField("course_id", v)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={GLOBAL}>Semua kelas (Global)</SelectItem>
                  {courses.map((co) => (
                    <SelectItem key={co.id} value={co.id}>
                      {co.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] tracking-editorial uppercase">Maks. Pemakaian</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.max_uses}
                  onChange={(e) => setField("max_uses", e.target.value)}
                  className="mt-1.5"
                  placeholder="Tanpa batas"
                />
              </div>
              <div>
                <Label className="text-[10px] tracking-editorial uppercase">Maks. Diskon (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.max_discount_idr}
                  onChange={(e) => setField("max_discount_idr", e.target.value)}
                  className="mt-1.5"
                  placeholder="Opsional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] tracking-editorial uppercase">Min. Pembelian (Rp)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.min_purchase_idr}
                  onChange={(e) => setField("min_purchase_idr", e.target.value)}
                  className="mt-1.5"
                  placeholder="Opsional"
                />
              </div>
              <div>
                <Label className="text-[10px] tracking-editorial uppercase">Kedaluwarsa</Label>
                <Input
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setField("expires_at", e.target.value)}
                  className="mt-1.5"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <Switch checked={form.is_active} onCheckedChange={(v) => setField("is_active", v)} />
              <Label className="text-[11px] tracking-editorial uppercase text-muted-foreground">Aktif</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" className="rounded-none" onClick={() => setEditorOpen(false)} disabled={saving}>
              Batal
            </Button>
            <Button className="rounded-none" onClick={handleSave} disabled={saving}>
              {saving ? "Menyimpan..." : editingId ? "Simpan" : "Buat"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Redemptions dialog */}
      <Dialog open={redemptionOpen} onOpenChange={setRedemptionOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Redemption — <span className="font-mono uppercase">{redemptionCoupon?.code}</span>
            </DialogTitle>
            <DialogDescription>Riwayat pemakaian kupon oleh pengguna.</DialogDescription>
          </DialogHeader>

          {redemptionLoading ? (
            <p className="text-muted-foreground text-sm py-6">Loading...</p>
          ) : redemptions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-6 text-center">Belum ada yang menggunakan kupon ini.</p>
          ) : (
            <div className="border border-border/50">
              <div className="grid grid-cols-12 gap-3 px-4 py-2.5 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
                <div className="col-span-5">Pengguna</div>
                <div className="col-span-2">Diskon</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-3">Tanggal</div>
              </div>
              {redemptions.map((r) => (
                <div key={r.id} className="grid grid-cols-12 gap-3 px-4 py-3 border-b border-border/50 last:border-0 items-center text-sm">
                  <div className="col-span-5">
                    <p className="text-foreground">{r.user.profile?.full_name ?? r.user.email.split("@")[0]}</p>
                    <p className="text-[11px] text-muted-foreground">{r.user.email}</p>
                  </div>
                  <div className="col-span-2 text-muted-foreground">{formatRupiah(r.discount_idr)}</div>
                  <div className="col-span-2">
                    {r.order ? (
                      <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 rounded ${orderStatus(r.order.status).className}`}>
                        {orderStatus(r.order.status).label}
                      </span>
                    ) : (
                      <span className="text-[11px] text-muted-foreground">—</span>
                    )}
                  </div>
                  <div className="col-span-3 text-[11px] text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" className="rounded-none" onClick={() => setRedemptionOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCoupons;
