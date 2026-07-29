import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const VerifikasiSertifikat = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    navigate(`/verifikasi/${encodeURIComponent(trimmed)}`);
  };

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-2xl">
          <PageHeader
            kicker="Verifikasi Sertifikat"
            title="Cek Keaslian Sertifikat"
            subtitle="Masukkan nomor sertifikat yang tertera pada sertifikat FAZ Academy untuk memeriksa keasliannya."
            className="mb-4"
          />

          <form onSubmit={handleSubmit} className="glass-panel rounded-2xl p-8 mt-8 flex flex-col gap-4 shadow-lg">
            <label
              htmlFor="cert-code"
              className="font-mono-editorial text-[12px] tracking-[0.15em] uppercase text-muted-foreground"
            >
              Nomor Sertifikat
            </label>
            <Input
              id="cert-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: MPB-26-05O5-IOCY"
              autoFocus
            />
            <Button type="submit" disabled={!code.trim()} variant="gradient" className="rounded-full gap-2 self-start">
              <ShieldCheck size={16} />
              Cek Sertifikat
            </Button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default VerifikasiSertifikat;
