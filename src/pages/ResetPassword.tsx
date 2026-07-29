import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/AuthShell";
import { api } from "@/lib/api";
import { toast } from "sonner";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Kata sandi minimal 8 karakter");
    if (password !== confirm) return toast.error("Konfirmasi kata sandi tidak cocok");
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, password });
      toast.success("Kata sandi berhasil diatur ulang. Silakan masuk.");
      navigate("/masuk");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengatur ulang kata sandi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Atur Ulang Kata Sandi" subtitle="Masukkan kata sandi baru untuk akunmu.">
      {!token ? (
        <div className="text-center space-y-4">
          <p className="text-foreground font-medium">Tautan tidak valid</p>
          <p className="text-sm text-muted-foreground">
            Token reset tidak ditemukan. Silakan minta tautan reset baru.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/lupa-password">Minta Tautan Baru</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="password">Kata Sandi Baru</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 8 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Konfirmasi Kata Sandi</Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Ulangi kata sandi baru"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
            />
          </div>
          <Button type="submit" variant="gradient" className="w-full rounded-full gap-2" size="lg" disabled={loading}>
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? "Menyimpan..." : "Atur Ulang Kata Sandi"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
};

export default ResetPassword;
