import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";

const Masuk = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <span className="font-serif text-3xl font-bold text-gold-gradient">FAZ</span>
            <h1 className="font-serif text-2xl font-bold text-foreground mt-4">Masuk ke Akun</h1>
            <p className="text-muted-foreground text-sm mt-2">Selamat datang kembali di FAZ Academy</p>
          </div>

          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan kata sandi"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full" size="lg">
              Masuk
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Belum punya akun?{" "}
              <Link to="/daftar" className="text-primary font-medium hover:underline">
                Daftar Sekarang
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Masuk;
