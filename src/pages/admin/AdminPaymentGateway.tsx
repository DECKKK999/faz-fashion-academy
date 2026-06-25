import { useEffect, useState } from "react";
import { Check, X, Copy, AlertTriangle } from "lucide-react";
import { api } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

type PaymentGatewayConfig = {
  enabled: boolean;
  gateway: string | null;
  has_server_key: boolean;
  has_webhook_secret: boolean;
  webhook_url: string;
};

const Bool = ({ value }: { value: boolean }) =>
  value ? (
    <span className="inline-flex items-center gap-1.5 text-[11px] tracking-editorial uppercase text-emerald-600">
      <Check size={13} /> Ya
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-[11px] tracking-editorial uppercase text-muted-foreground">
      <X size={13} /> Tidak
    </span>
  );

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="flex items-center justify-between px-5 py-4 border-b border-border/50 last:border-0">
    <span className="text-[11px] tracking-editorial uppercase text-muted-foreground">{label}</span>
    <div className="text-sm text-foreground">{children}</div>
  </div>
);

const AdminPaymentGateway = () => {
  const [config, setConfig] = useState<PaymentGatewayConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        setConfig(await api.get<PaymentGatewayConfig>("/admin/payment-gateway/config"));
      } catch (e) {
        toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const copyWebhook = async () => {
    if (!config?.webhook_url) return;
    try {
      await navigator.clipboard.writeText(config.webhook_url);
      toast({ title: "URL webhook disalin" });
    } catch {
      toast({ title: "Gagal menyalin", variant: "destructive" });
    }
  };

  return (
    <div className="p-10 max-w-3xl">
      <div className="mb-8">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl">Payment Gateway</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Status integrasi gateway pembayaran (Midtrans / Xendit) sebagai alternatif transfer manual.
          Konfigurasi dikelola lewat environment variable di server &mdash; panel ini hanya untuk melihat status.
        </p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : !config ? (
        <p className="text-muted-foreground text-sm">Tidak ada data konfigurasi.</p>
      ) : (
        <>
          {!config.enabled && (
            <div className="border border-border/50 bg-foreground/5 p-5 mb-6 flex items-start gap-3">
              <AlertTriangle size={16} className="text-muted-foreground mt-0.5 shrink-0" />
              <div className="text-sm text-muted-foreground">
                Gateway pembayaran <span className="text-foreground">belum diaktifkan</span>. Sistem saat ini hanya
                menerima transfer manual. Aktifkan dengan menyetel env <code className="text-foreground">PAYMENT_GATEWAY</code>
                {" "}ke <code className="text-foreground">midtrans</code> atau <code className="text-foreground">xendit</code>.
              </div>
            </div>
          )}

          <div className="border border-border/50">
            <Row label="Status">
              <span
                className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 ${
                  config.enabled ? "bg-foreground/10 text-foreground" : "text-muted-foreground"
                }`}
              >
                {config.enabled ? "Aktif" : "Nonaktif"}
              </span>
            </Row>
            <Row label="Provider">
              {config.gateway ? (
                <span className="capitalize text-foreground">{config.gateway}</span>
              ) : (
                <span className="text-muted-foreground">&mdash;</span>
              )}
            </Row>
            <Row label="Server Key Terisi">
              <Bool value={config.has_server_key} />
            </Row>
            <Row label="Webhook Secret Terisi">
              <Bool value={config.has_webhook_secret} />
            </Row>
            <Row label="Webhook URL">
              <button
                onClick={copyWebhook}
                className="inline-flex items-center gap-2 text-[12px] text-foreground hover:text-muted-foreground transition-colors"
                title="Salin URL webhook"
              >
                <span className="font-mono break-all text-right">{config.webhook_url}</span>
                <Copy size={13} className="shrink-0" />
              </button>
            </Row>
          </div>

          <p className="text-[11px] text-muted-foreground mt-4 leading-relaxed">
            Daftarkan URL webhook di atas pada dashboard provider agar status pembayaran otomatis tersinkron.
            Catatan: implementasi webhook saat ini masih scaffold (membaca JSON body); produksi sebaiknya
            beralih ke raw body untuk verifikasi signature.
          </p>
        </>
      )}
    </div>
  );
};

export default AdminPaymentGateway;
