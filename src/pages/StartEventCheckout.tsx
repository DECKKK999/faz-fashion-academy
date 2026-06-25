import { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { api, ApiError, type Order } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

// Membuat order tiket event lalu meneruskan ke halaman checkout.
// Menangani: belum login (redirect), event gratis (langsung tiket), sudah punya tiket, order aktif (resume).
const StartEventCheckout = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (loading || !eventId) return;
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent(`/beli-event/${eventId}`)}`, { replace: true });
      return;
    }
    if (started.current) return;
    started.current = true;

    (async () => {
      try {
        const res = await api.post<{ order?: Order; free?: boolean; resumed?: boolean }>("/orders/event", {
          event_id: eventId,
        });
        if (res.free) {
          toast.success("Tiket event gratis berhasil diambil!");
          navigate("/dashboard", { replace: true });
          return;
        }
        if (res.order) {
          navigate(`/checkout/${res.order.id}`, { replace: true });
          return;
        }
        navigate("/event", { replace: true });
      } catch (e) {
        if (e instanceof ApiError && e.status === 409) {
          toast.info("Kamu sudah punya tiket event ini.");
          navigate("/dashboard", { replace: true });
          return;
        }
        toast.error(e instanceof Error ? e.message : "Gagal memproses pesanan");
        navigate("/event", { replace: true });
      }
    })();
  }, [user, loading, eventId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 text-center text-muted-foreground text-sm tracking-editorial uppercase">
        Memproses pesanan...
      </div>
    </div>
  );
};

export default StartEventCheckout;
