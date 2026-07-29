import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
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
    <AuthShell title="Verifikasi Email">
      <div className="text-center space-y-4">
        {status === "loading" && (
          <>
            <Loader2 className="mx-auto text-muted-foreground animate-spin" size={36} />
            <p className="text-sm text-muted-foreground">Memverifikasi email kamu...</p>
          </>
        )}
        {status === "success" && (
          <>
            <CheckCircle2 className="mx-auto text-emerald-500" size={40} />
            <p className="text-foreground font-medium">Berhasil!</p>
            <p className="text-sm text-muted-foreground">{message}</p>
            <div className="flex flex-col gap-2 pt-2">
              <Button asChild variant="gradient" className="w-full rounded-full">
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
            <AlertCircle className="mx-auto text-red-500" size={40} />
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
    </AuthShell>
  );
};

export default VerifikasiEmail;
