import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";

type Status = "loading" | "success" | "error";

const VerifikasiEmail = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [status, setStatus] = useState<Status>("loading");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("Token verifikasi tidak ditemukan.");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then(() => {
        setStatus("success");
        setMessage("Email kamu berhasil diverifikasi.");
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err instanceof Error ? err.message : "Tautan verifikasi tidak valid atau sudah kedaluwarsa.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="font-serif text-3xl font-bold text-gold-gradient">FAZ</span>
            <h1 className="font-serif text-2xl font-bold text-foreground mt-4">Verifikasi Email</h1>
          </div>

          <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
            {status === "loading" && (
              <>
                <Loader2 className="mx-auto text-muted-foreground animate-spin" size={36} />
                <p className="text-sm text-muted-foreground">Memverifikasi email kamu...</p>
              </>
            )}
            {status === "success" && (
              <>
                <CheckCircle2 className="mx-auto text-emerald-600" size={40} />
                <p className="text-foreground font-medium">Berhasil!</p>
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild className="w-full">
                    <Link to="/dashboard">Buka Dashboard</Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/akun">Pengaturan Akun</Link>
                  </Button>
                </div>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="mx-auto text-red-600" size={40} />
                <p className="text-foreground font-medium">Verifikasi gagal</p>
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex flex-col gap-2 pt-2">
                  <Button asChild variant="outline" className="w-full">
                    <Link to="/akun">Kirim Ulang dari Akun</Link>
                  </Button>
                  <Button asChild variant="ghost" className="w-full">
                    <Link to="/masuk">Masuk</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifikasiEmail;
