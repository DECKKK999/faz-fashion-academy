import { useEffect, useState } from "react";
import { Search, Download, Copy, ShieldX, ShieldCheck } from "lucide-react";
import { api, type Certificate } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

type RevokedFilter = "all" | "false" | "true";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const AdminCertificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [revoked, setRevoked] = useState<RevokedFilter>("all");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (revoked !== "all") params.set("revoked", revoked);
      const qs = params.toString();
      const data = await api.get<Certificate[]>(`/admin/certificates${qs ? `?${qs}` : ""}`);
      setCertificates(data);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revoked]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  const handleRevoke = async (cert: Certificate) => {
    if (cert.revoked) {
      if (!confirm(`Pulihkan sertifikat ${cert.certificate_number}?`)) return;
      setBusy(cert.id);
      try {
        await api.patch(`/admin/certificates/${cert.id}/revoke`, { revoked: false });
        toast({ title: "Sertifikat dipulihkan" });
        load();
      } catch (e) {
        toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal", variant: "destructive" });
      } finally {
        setBusy(null);
      }
      return;
    }

    const reason = prompt(`Alasan pencabutan sertifikat ${cert.certificate_number}?`);
    if (reason === null) return;
    setBusy(cert.id);
    try {
      await api.patch(`/admin/certificates/${cert.id}/revoke`, {
        revoked: true,
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      });
      toast({ title: "Sertifikat dicabut" });
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    setBusy(cert.id);
    try {
      const res = await fetch(`/api/certificates/${cert.id}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengunduh");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat-${cert.certificate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const handleCopy = async (cert: Certificate) => {
    const link = `${window.location.origin}/verifikasi/${cert.certificate_number}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({ title: "Tautan verifikasi disalin" });
    } catch {
      toast({ title: "Error", description: "Gagal menyalin", variant: "destructive" });
    }
  };

  const filters: { value: RevokedFilter; label: string }[] = [
    { value: "all", label: "Semua" },
    { value: "false", label: "Aktif" },
    { value: "true", label: "Dicabut" },
  ];

  return (
    <div className="p-10 max-w-6xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl">Sertifikat</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Kelola sertifikat penyelesaian kelas. Cabut sertifikat yang tidak valid.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center justify-between mb-6">
        <div className="flex gap-2">
          {filters.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={revoked === f.value ? "default" : "outline"}
              onClick={() => setRevoked(f.value)}
              className="rounded-none text-[10px] tracking-editorial uppercase h-8"
            >
              {f.label}
            </Button>
          ))}
        </div>
        <form onSubmit={handleSearch} className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
          <Input
            placeholder="Cari nomor, nama, kelas, email..."
            className="pl-9 h-9 text-sm rounded-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : certificates.length === 0 ? (
        <div className="border border-border/50 p-12 text-center">
          <p className="text-muted-foreground">Tidak ada sertifikat.</p>
        </div>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-3">Penerima</div>
            <div className="col-span-3">Kelas</div>
            <div className="col-span-2">Nomor</div>
            <div className="col-span-1">Terbit</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          {certificates.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center text-sm"
            >
              <div className="col-span-3 min-w-0">
                <p className="text-foreground truncate">{c.recipient_name}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.user?.email ?? "—"}
                </p>
              </div>
              <div className="col-span-3 text-muted-foreground truncate">{c.course_title}</div>
              <div className="col-span-2 text-[11px] text-muted-foreground truncate">{c.certificate_number}</div>
              <div className="col-span-1 text-[11px] text-muted-foreground">{formatDate(c.issued_at)}</div>
              <div className="col-span-1">
                <span
                  className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 ${
                    c.revoked ? "bg-red-500/15 text-red-600" : "bg-emerald-500/15 text-emerald-600"
                  }`}
                >
                  {c.revoked ? "Dicabut" : "Aktif"}
                </span>
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <Button size="sm" variant="ghost" disabled={busy === c.id} onClick={() => handleDownload(c)} title="Unduh PDF">
                  <Download size={14} />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleCopy(c)} title="Salin tautan verifikasi">
                  <Copy size={14} />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy === c.id}
                  onClick={() => handleRevoke(c)}
                  title={c.revoked ? "Pulihkan" : "Cabut"}
                >
                  {c.revoked ? <ShieldCheck size={14} /> : <ShieldX size={14} className="text-red-600" />}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminCertificates;
