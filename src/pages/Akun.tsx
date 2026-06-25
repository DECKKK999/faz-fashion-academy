import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Loader2, MailWarning, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type Session } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Akun = () => {
  const { user, profile, refresh } = useAuth();

  const [fullName, setFullName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const fileInput = useRef<HTMLInputElement>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const [resending, setResending] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name ?? "");
  }, [profile?.full_name]);

  const initials = (profile?.full_name || user?.email || "?").trim().charAt(0).toUpperCase();

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return toast.error("Nama wajib diisi");
    setSavingProfile(true);
    try {
      await api.patch<Session>("/account/profile", { full_name: fullName.trim() });
      await refresh();
      toast.success("Profil diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui profil");
    } finally {
      setSavingProfile(false);
    }
  };

  const onAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) e.target.value = "";
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append("avatar", file);
      await api.upload<Session>("/account/avatar", fd);
      await refresh();
      toast.success("Avatar diperbarui");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengunggah avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error("Kata sandi baru minimal 8 karakter");
    if (newPassword !== confirmPassword) return toast.error("Konfirmasi kata sandi tidak cocok");
    setChangingPassword(true);
    try {
      await api.post("/account/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Kata sandi berhasil diubah");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengubah kata sandi");
    } finally {
      setChangingPassword(false);
    }
  };

  const resendVerification = async () => {
    setResending(true);
    try {
      await api.post("/auth/resend-verification");
      toast.success("Email verifikasi telah dikirim. Cek kotak masukmu.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim email verifikasi");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={13} /> Dashboard
          </Link>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">Pengaturan Akun</h1>

          {/* Banner verifikasi email */}
          {user && user.email_verified === false && (
            <div className="border border-amber-500/40 bg-amber-500/10 rounded-lg p-5 mb-8">
              <div className="flex items-start gap-3">
                <MailWarning className="text-amber-600 shrink-0 mt-0.5" size={20} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">Email belum terverifikasi</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Verifikasi alamat <span className="font-medium">{user.email}</span> untuk mengamankan akunmu.
                  </p>
                  <Button
                    onClick={resendVerification}
                    disabled={resending}
                    variant="outline"
                    size="sm"
                    className="mt-3 gap-2"
                  >
                    {resending && <Loader2 size={14} className="animate-spin" />}
                    Kirim Ulang Email Verifikasi
                  </Button>
                </div>
              </div>
            </div>
          )}
          {user && user.email_verified === true && (
            <div className="border border-emerald-500/30 bg-emerald-500/10 rounded-lg p-4 mb-8 flex items-center gap-3">
              <ShieldCheck className="text-emerald-600 shrink-0" size={18} />
              <p className="text-sm text-foreground">Email kamu sudah terverifikasi.</p>
            </div>
          )}

          {/* Avatar */}
          <section className="border border-border rounded-lg p-6 mb-6">
            <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-4">Foto Profil</p>
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-muted flex items-center justify-center text-2xl font-serif text-muted-foreground">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-background/70 flex items-center justify-center">
                    <Loader2 size={20} className="animate-spin text-foreground" />
                  </div>
                )}
              </div>
              <div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onAvatarChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  disabled={uploadingAvatar}
                  onClick={() => fileInput.current?.click()}
                >
                  <Camera size={15} /> Ganti Foto
                </Button>
                <p className="text-xs text-muted-foreground mt-2">JPG/PNG/WebP, maks 3 MB.</p>
              </div>
            </div>
          </section>

          {/* Profil */}
          <section className="border border-border rounded-lg p-6 mb-6">
            <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-4">Informasi Profil</p>
            <form onSubmit={saveProfile} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user?.email ?? ""} disabled />
              </div>
              <div className="space-y-2">
                <Label htmlFor="full_name">Nama Lengkap</Label>
                <Input
                  id="full_name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Nama lengkapmu"
                  required
                />
              </div>
              <Button type="submit" disabled={savingProfile} className="gap-2">
                {savingProfile && <Loader2 size={15} className="animate-spin" />}
                {savingProfile ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </section>

          {/* Ubah kata sandi */}
          <section className="border border-border rounded-lg p-6">
            <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-4">Ubah Kata Sandi</p>
            <form onSubmit={changePassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Kata Sandi Saat Ini</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_password">Kata Sandi Baru</Label>
                <Input
                  id="new_password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimal 8 karakter"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm_password">Konfirmasi Kata Sandi Baru</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={changingPassword} className="gap-2">
                {changingPassword && <Loader2 size={15} className="animate-spin" />}
                {changingPassword ? "Menyimpan..." : "Ubah Kata Sandi"}
              </Button>
            </form>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Akun;
