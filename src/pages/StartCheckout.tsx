import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { api } from "@/lib/api";

// Rute lama /beli/:courseId sebelum ada keranjang — dibiarkan hidup cuma
// supaya link/bookmark lama tidak 404, tapi diarahkan langsung ke halaman
// kelas supaya tetap lewat satu pintu pembayaran: keranjang → checkout.
const StartCheckout = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (!courseId) {
      navigate("/kelas", { replace: true });
      return;
    }
    api
      .get<{ slug: string }>(`/courses/${courseId}`)
      .then((c) => navigate(`/kelas/${c.slug}`, { replace: true }))
      .catch(() => navigate("/kelas", { replace: true }));
  }, [courseId, navigate]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-32 text-center text-muted-foreground text-sm uppercase">Mengalihkan...</div>
    </div>
  );
};

export default StartCheckout;
