import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { api, type BankAccount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import EmailTestCard from "@/components/admin/EmailTestCard";

const AdminSettings = () => {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      setAccounts(await api.get<BankAccount[]>("/admin/bank-accounts"));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const setField = (id: string, field: keyof BankAccount, value: string | boolean | number) => {
    setAccounts((prev) => prev.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
  };

  const addAccount = async () => {
    try {
      const created = await api.post<BankAccount>("/admin/bank-accounts", {
        bank: "Bank Baru",
        account_number: "0000000000",
        account_name: "PT FAZ Academy Indonesia",
        position: accounts.length,
      });
      setAccounts([...accounts, created]);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menambah", variant: "destructive" });
    }
  };

  const saveAccount = async (a: BankAccount) => {
    setSavingId(a.id);
    try {
      await api.patch(`/admin/bank-accounts/${a.id}`, {
        bank: a.bank,
        account_number: a.account_number,
        account_name: a.account_name,
        is_active: a.is_active,
        position: a.position,
      });
      toast({ title: "Rekening disimpan" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  const deleteAccount = async (id: string) => {
    if (!confirm("Hapus rekening ini?")) return;
    try {
      await api.delete(`/admin/bank-accounts/${id}`);
      setAccounts(accounts.filter((a) => a.id !== id));
      toast({ title: "Rekening dihapus" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menghapus", variant: "destructive" });
    }
  };

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl">Pengaturan Pembayaran</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Kelola rekening tujuan transfer. Rekening yang <span className="text-foreground">aktif</span> akan ditampilkan di halaman checkout pembeli.
        </p>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">Rekening Bank</h2>
        <Button onClick={addAccount} className="rounded-none gap-2" size="sm">
          <Plus size={14} /> Tambah Rekening
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : accounts.length === 0 ? (
        <div className="border border-border/50 p-12 text-center">
          <p className="text-muted-foreground mb-4">Belum ada rekening. Tambahkan minimal satu agar pembeli bisa transfer.</p>
          <Button onClick={addAccount} className="rounded-none">Tambah Rekening</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((a) => (
            <div key={a.id} className="border border-border/50 p-5">
              <div className="flex items-start gap-3">
                <GripVertical size={16} className="text-muted-foreground mt-9" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <Label className="text-[10px] tracking-editorial uppercase">Bank</Label>
                    <Input value={a.bank} onChange={(e) => setField(a.id, "bank", e.target.value)} className="mt-1.5" placeholder="BCA" />
                  </div>
                  <div>
                    <Label className="text-[10px] tracking-editorial uppercase">No. Rekening</Label>
                    <Input value={a.account_number} onChange={(e) => setField(a.id, "account_number", e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-[10px] tracking-editorial uppercase">Atas Nama</Label>
                    <Input value={a.account_name} onChange={(e) => setField(a.id, "account_name", e.target.value)} className="mt-1.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-4 pl-7">
                <div className="flex items-center gap-2">
                  <Switch checked={a.is_active} onCheckedChange={(v) => setField(a.id, "is_active", v)} />
                  <Label className="text-[11px] tracking-editorial uppercase text-muted-foreground">Aktif</Label>
                  <div className="flex items-center gap-1 ml-4">
                    <Label className="text-[11px] tracking-editorial uppercase text-muted-foreground">Urutan</Label>
                    <Input
                      type="number"
                      value={a.position}
                      onChange={(e) => setField(a.id, "position", Number(e.target.value) || 0)}
                      className="h-8 w-16"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => deleteAccount(a.id)} className="text-muted-foreground hover:text-red-600">
                    <Trash2 size={14} />
                  </Button>
                  <Button size="sm" className="rounded-none" disabled={savingId === a.id} onClick={() => saveAccount(a)}>
                    {savingId === a.id ? "Menyimpan..." : "Simpan"}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-12">
        <h2 className="text-xl mb-4">Email</h2>
        <EmailTestCard />
      </div>
    </div>
  );
};

export default AdminSettings;
