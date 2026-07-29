import { useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AuthShell from "@/components/auth/AuthShell";
import { api } from "@/lib/api";
import { toast } from "sonner";

const LupaPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim tautan reset");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Lupa Kata Sandi"
      subtitle="Masukkan emailmu, kami akan mengirimkan tautan untuk mengatur ulang kata sandi."
    >
      {sent ? (
        <div className="text-center space-y-4">
          <CheckCircle2 className="mx-auto text-emerald-500" size={36} />
          <p className="text-foreground font-medium">Periksa email kamu</p>
          <p className="text-sm text-muted-foreground">
            Jika email tersebut terdaftar, kami sudah mengirimkan tautan reset kata sandi. Tautan berlaku 1 jam.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link to="/masuk">Kembali ke Masuk</Link>
          </Button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full rounded-full gap-2" size="lg" disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Mengirim..." : "Kirim Tautan Reset"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Ingat kata sandimu?{" "}
            <Link to="/masuk" className="text-primary font-medium hover:underline">
              Masuk
            </Link>
          </p>
        </>
      )}
    </AuthShell>
  );
};

export default LupaPassword;
