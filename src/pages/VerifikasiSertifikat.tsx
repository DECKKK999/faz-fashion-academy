import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
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
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-2xl">
          <div className="mb-4">
            <p className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground mb-2">
              Verifikasi Sertifikat
            </p>
            <h1 className="text-3xl md:text-4xl font-light text-foreground tracking-normal">
              Cek Keaslian Sertifikat
            </h1>
            <p
              className="text-sm text-muted-foreground mt-3"
              style={{ letterSpacing: "normal", textTransform: "none" }}
            >
              Masukkan nomor sertifikat yang tertera pada sertifikat FAZ Academy untuk memeriksa
              keasliannya.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="border border-border p-8 mt-8 flex flex-col gap-4">
            <label
              htmlFor="cert-code"
              className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground"
            >
              Nomor Sertifikat
            </label>
            <Input
              id="cert-code"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Contoh: MPB-26-05O5-IOCY"
              className="rounded-none"
              autoFocus
            />
            <Button type="submit" disabled={!code.trim()} className="rounded-none gap-2 self-start">
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
