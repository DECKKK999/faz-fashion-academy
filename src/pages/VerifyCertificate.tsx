import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ShieldX, ShieldAlert, Award, Clock, Download } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import PageHeader from "@/components/PageHeader";
import Kicker from "@/components/landing/Kicker";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

type VerifyResult = {
  valid: boolean;
  not_issued?: boolean;
  revoked?: boolean;
  certificate_number: string;
  recipient_name?: string;
  course_title?: string;
  instructor_name?: string | null;
  issued_at?: string;
  revoked_at?: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-b border-border last:border-0">
    <span className="text-[11px] tracking-editorial uppercase text-muted-foreground w-40 shrink-0">{label}</span>
    <span className="text-sm text-foreground" style={{ letterSpacing: "normal", textTransform: "none" }}>
      {value}
    </span>
  </div>
);

const VerifyCertificate = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "revoked" | "not_issued" | "invalid">("loading");
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!certificateNumber) {
        setStatus("invalid");
        return;
      }
      try {
        const data = await api.get<VerifyResult>(`/certificates/verify/${encodeURIComponent(certificateNumber)}`);
        if (!active) return;
        setResult(data);
        setStatus(data.not_issued ? "not_issued" : data.revoked ? "revoked" : "valid");
      } catch (e) {
        if (!active) return;
        if (e instanceof ApiError && e.status === 404) setStatus("invalid");
        else setStatus("invalid");
      }
    })();
    return () => {
      active = false;
    };
  }, [certificateNumber]);

  const handleDownload = async () => {
    if (!certificateNumber) return;
    setDownloading(true);
    try {
      const res = await fetch(`/api/certificates/verify/${encodeURIComponent(certificateNumber)}/download`);
      if (!res.ok) throw new Error("Gagal mengunduh sertifikat");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat-${certificateNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // no-op — tombol tetap bisa dicoba lagi
    } finally {
      setDownloading(false);
    }
  };

  const banner = {
    loading: { icon: Award, color: "text-muted-foreground", border: "border-border", title: "Memverifikasi...", sub: "Memeriksa keaslian sertifikat." },
    valid: { icon: ShieldCheck, color: "text-emerald-500", border: "border-emerald-500/40", title: "Sertifikat Sah", sub: "Sertifikat ini diterbitkan dan terverifikasi oleh FAZ Academy." },
    revoked: { icon: ShieldAlert, color: "text-amber-500", border: "border-amber-500/40", title: "Sertifikat Dicabut", sub: "Sertifikat ini pernah diterbitkan namun telah dicabut dan tidak lagi berlaku." },
    not_issued: { icon: Clock, color: "text-amber-500", border: "border-amber-500/40", title: "Sertifikat Belum Diterbitkan", sub: "Nomor ini terdaftar di sistem kami, tapi belum diberikan ke peserta manapun." },
    invalid: { icon: ShieldX, color: "text-red-500", border: "border-red-500/40", title: "Sertifikat Tidak Ditemukan", sub: "Nomor sertifikat tidak terdaftar di sistem kami." },
  }[status];

  const Icon = banner.icon;

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-2xl">
          <PageHeader kicker="Verifikasi Sertifikat" title="Keaslian Sertifikat" className="mb-4" />

          <div className="border-t border-border pt-3 mb-10">
            <Kicker tone="olive">No. {certificateNumber}</Kicker>
          </div>

          <div className={`glass-panel rounded-2xl shadow-lg border ${banner.border} p-8 mb-8`}>
            <div className="flex items-start gap-4">
              <Icon size={32} className={`${banner.color} shrink-0`} />
              <div>
                <h2 className="text-lg font-light text-foreground tracking-normal">{banner.title}</h2>
                <p
                  className="text-sm text-muted-foreground mt-1"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  {banner.sub}
                </p>
              </div>
            </div>
          </div>

          {result && (status === "valid" || status === "revoked") && (
            <div className="glass-panel rounded-2xl shadow-lg p-8">
              <Row label="Penerima" value={result.recipient_name!} />
              <Row label="Kelas" value={result.course_title!} />
              {result.instructor_name && <Row label="Instruktur" value={result.instructor_name} />}
              <Row label="Diterbitkan" value={formatDate(result.issued_at!)} />
              <Row label="Nomor Sertifikat" value={result.certificate_number} />
              {status === "revoked" && result.revoked_at && (
                <Row label="Dicabut Pada" value={formatDate(result.revoked_at)} />
              )}
            </div>
          )}

          <div className="mt-10 flex flex-wrap gap-3">
            {status === "valid" && (
              <Button onClick={handleDownload} disabled={downloading} variant="gradient" className="rounded-full gap-2">
                <Download size={14} />
                {downloading ? "Mengunduh..." : "Unduh Sertifikat"}
              </Button>
            )}
            <Button asChild variant="outline" className="rounded-full">
              <Link to="/">Kembali ke Beranda</Link>
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifyCertificate;
