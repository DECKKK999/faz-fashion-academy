import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { api, ApiError, type Order } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Membuat order lalu meneruskan ke halaman checkout.
// Menangani: belum login (redirect), kelas gratis (langsung enroll), sudah punya kelas, order aktif (resume).
const StartCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (loading || !courseId) return;
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent(`/beli/${courseId}`)}`, { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const res = await api.post<{ order?: Order; free?: boolean; resumed?: boolean }>("/orders", {
          course_id: courseId,
        });
        if (res.free) {
          toast.success("Kelas gratis berhasil diambil!");
          navigate("/dashboard", { replace: true });
          return;
        }
        if (res.order) {
          navigate(`/checkout/${res.order.id}`, { replace: true });
          return;
        }
        navigate("/kelas", { replace: true });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          toast.info("Kamu sudah memiliki kelas ini.");
          navigate("/dashboard", { replace: true });
          return;
        }
        toast.error(e instanceof Error ? e.message : "Gagal memproses pesanan");
        navigate("/kelas", { replace: true });
      }
    })();
  }, [user, loading, courseId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 text-center text-muted-foreground text-sm tracking-editorial uppercase">
        Memproses pesanan...
      </div>
    </div>
  );
};

export default StartCheckout;
