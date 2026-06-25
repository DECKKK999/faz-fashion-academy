import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { api, type EmailLog } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const STATUS_OPTIONS = [
  { value: "all", label: "Semua Status" },
  { value: "sent", label: "Terkirim" },
  { value: "failed", label: "Gagal" },
];

const TEMPLATE_OPTIONS = [
  { value: "all", label: "Semua Template" },
  { value: "welcome", label: "Welcome" },
  { value: "order_created", label: "Order Created" },
  { value: "payment_verified", label: "Payment Verified" },
  { value: "payment_rejected", label: "Payment Rejected" },
  { value: "password_reset", label: "Password Reset" },
  { value: "email_verification", label: "Email Verification" },
  { value: "test", label: "Test" },
];

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const AdminEmailLogs = () => {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("all");
  const [template, setTemplate] = useState("all");

  const load = async (st = status, tpl = template) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ take: "100" });
      if (st !== "all") params.set("status", st);
      if (tpl !== "all") params.set("template", tpl);
      setLogs(await api.get<EmailLog[]>(`/admin/email/logs?${params.toString()}`));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(status, template);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, template]);

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-start justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl">Email Log</h1>
          <p className="text-muted-foreground text-sm mt-2">Riwayat email yang dikirim sistem.</p>
        </div>
        <Button variant="outline" className="rounded-none gap-2" onClick={() => load()}>
          <RefreshCw size={14} /> Muat Ulang
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap mb-6">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44 rounded-none">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={template} onValueChange={setTemplate}>
          <SelectTrigger className="w-52 rounded-none">
            <SelectValue placeholder="Template" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : logs.length === 0 ? (
        <div className="border border-border/50 p-12 text-center text-muted-foreground text-sm">
          Belum ada email yang tercatat.
        </div>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-3">Penerima</div>
            <div className="col-span-3">Subjek</div>
            <div className="col-span-2">Template</div>
            <div className="col-span-1">Transport</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2 text-right">Waktu</div>
          </div>
          {logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-start text-sm"
            >
              <div className="col-span-3 break-all text-foreground">{log.to_email}</div>
              <div className="col-span-3 text-muted-foreground">{log.subject}</div>
              <div className="col-span-2">
                <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">{log.template}</span>
              </div>
              <div className="col-span-1">
                <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">{log.transport}</span>
              </div>
              <div className="col-span-1">
                {log.status === "sent" ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600">
                    <CheckCircle2 size={13} /> Sent
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] text-red-600" title={log.error ?? undefined}>
                    <XCircle size={13} /> Failed
                  </span>
                )}
              </div>
              <div className="col-span-2 text-right text-[11px] text-muted-foreground">{formatDate(log.created_at)}</div>
              {log.status === "failed" && log.error && (
                <div className="col-span-12 -mt-2 text-[11px] text-red-600/80 break-all">{log.error}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEmailLogs;
