import { useEffect, useState } from "react";
import { Mail, Send, CheckCircle2, AlertTriangle } from "lucide-react";
import { api, type MailerConfig } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";

type TestResult = { ok: boolean; transport: "dev" | "smtp"; logId: string };

const EmailTestCard = () => {
  const [config, setConfig] = useState<MailerConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let active = true;
    api
      .get<MailerConfig>("/admin/email/config")
      .then((c) => active && setConfig(c))
      .catch((e) =>
        toast({
          title: "Error",
          description: e instanceof Error ? e.message : "Gagal memuat konfigurasi mailer",
          variant: "destructive",
        })
      )
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const sendTest = async () => {
    setSending(true);
    try {
      const body = to.trim() ? { to: to.trim() } : {};
      const result = await api.post<TestResult>("/admin/email/test", body);
      if (result.ok) {
        toast({
          title: "Email tes terkirim",
          description: `Dikirim via transport "${result.transport}".`,
        });
      } else {
        toast({
          title: "Pengiriman gagal",
          description: `Transport "${result.transport}" gagal mengirim. Cek Email Log untuk detail.`,
          variant: "destructive",
        });
      }
    } catch (e) {
      toast({
        title: "Error",
        description: e instanceof Error ? e.message : "Gagal mengirim email tes",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border border-border/50 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Mail size={16} className="text-muted-foreground" />
        <h2 className="text-xl">Email & Mailer</h2>
      </div>
      <p className="text-muted-foreground text-sm mb-5">
        Kirim email tes untuk memastikan konfigurasi mailer berfungsi.
      </p>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : config ? (
        <>
          <div className="space-y-2 text-sm mb-6">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Transport aktif</span>
              <span className="text-foreground uppercase tracking-editorial text-[11px] px-2 py-0.5 bg-foreground/10">
                {config.transport}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Pengirim (from)</span>
              <span className="text-foreground text-right break-all">{config.from}</span>
            </div>
            <div className="flex justify-between gap-4 items-center">
              <span className="text-muted-foreground">SMTP</span>
              {config.smtpConfigured ? (
                <span className="inline-flex items-center gap-1 text-foreground">
                  <CheckCircle2 size={14} className="text-emerald-600" /> Terkonfigurasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <AlertTriangle size={14} className="text-amber-600" /> Belum diatur
                </span>
              )}
            </div>
          </div>

          {config.transport === "dev" && (
            <div className="border border-amber-500/30 bg-amber-500/5 p-3 mb-5 text-[12px] text-muted-foreground">
              Transport <span className="text-foreground">dev</span> aktif — email tidak benar-benar dikirim, hanya
              disimpan ke folder <span className="text-foreground">maildir</span> dan ditulis ke console server.
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-[10px] tracking-editorial uppercase">Kirim tes ke</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="Kosongkan untuk kirim ke email kamu"
                className="flex-1"
              />
              <Button onClick={sendTest} disabled={sending} className="rounded-none gap-2 shrink-0">
                <Send size={14} /> {sending ? "Mengirim..." : "Kirim Tes"}
              </Button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground text-sm">Konfigurasi mailer tidak tersedia.</p>
      )}
    </div>
  );
};

export default EmailTestCard;
