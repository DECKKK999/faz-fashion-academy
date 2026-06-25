import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ShieldX, ShieldAlert, Award } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";

type VerifyResult = {
  valid: true;
  revoked: boolean;
  certificate_number: string;
  recipient_name: string;
  course_title: string;
  instructor_name: string | null;
  issued_at: string;
  revoked_at: string | null;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4 py-3 border-b border-border last:border-0">
    <span className="text-[10px] tracking-editorial uppercase text-muted-foreground w-40 shrink-0">{label}</span>
    <span className="text-sm text-foreground" style={{ letterSpacing: "normal", textTransform: "none" }}>
      {value}
    </span>
  </div>
);

const VerifyCertificate = () => {
  const { certificateNumber } = useParams<{ certificateNumber: string }>();
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [status, setStatus] = useState<"loading" | "valid" | "revoked" | "invalid">("loading");

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
        setStatus(data.revoked ? "revoked" : "valid");
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

  const banner = {
    loading: { icon: Award, color: "text-muted-foreground", border: "border-border", title: "Memverifikasi...", sub: "Memeriksa keaslian sertifikat." },
    valid: { icon: ShieldCheck, color: "text-emerald-600", border: "border-emerald-600/40", title: "Sertifikat Sah", sub: "Sertifikat ini diterbitkan dan terverifikasi oleh FAZ Academy." },
    revoked: { icon: ShieldAlert, color: "text-amber-600", border: "border-amber-600/40", title: "Sertifikat Dicabut", sub: "Sertifikat ini pernah diterbitkan namun telah dicabut dan tidak lagi berlaku." },
    invalid: { icon: ShieldX, color: "text-red-600", border: "border-red-600/40", title: "Sertifikat Tidak Ditemukan", sub: "Nomor sertifikat tidak terdaftar di sistem kami." },
  }[status];

  const Icon = banner.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-2xl">
          <div className="mb-4">
            <p className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground mb-2">
              Verifikasi Sertifikat
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-foreground tracking-normal">
              Keaslian Sertifikat
            </h1>
          </div>

          <div className="border-t border-border pt-3 mb-10">
            <span className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground">
              No. {certificateNumber}
            </span>
          </div>

          <div className={`border ${banner.border} p-8 mb-8`}>
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
            <div className="border border-border p-8">
              <Row label="Penerima" value={result.recipient_name} />
              <Row label="Kelas" value={result.course_title} />
              {result.instructor_name && <Row label="Instruktur" value={result.instructor_name} />}
              <Row label="Diterbitkan" value={formatDate(result.issued_at)} />
              <Row label="Nomor Sertifikat" value={result.certificate_number} />
              {status === "revoked" && result.revoked_at && (
                <Row label="Dicabut Pada" value={formatDate(result.revoked_at)} />
              )}
            </div>
          )}

          <div className="mt-10">
            <Button asChild variant="outline" className="rounded-none">
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
