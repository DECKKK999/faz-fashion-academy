import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { PROMO_PRICE_IDR } from "@/lib/promo";
import promoLennyCard from "@/assets/promo-lenny-card.jpg";

const SEEN_KEY = "promo_fashion_design_popup_seen";
const OPEN_DELAY_MS = 1500;

const PromoPopup = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY)) return;
    const timer = setTimeout(() => {
      setOpen(true);
      localStorage.setItem(SEEN_KEY, "1");
    }, OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  const goToPromo = () => {
    setOpen(false);
    navigate("/promo/fashion-design");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-2xl">
        <button type="button" onClick={goToPromo} className="block w-full">
          <img
            src={promoLennyCard}
            alt="Promo kelas Memulai Bisnis Pakaian bersama Lenny Agustin, mentor FAZ Academy"
            className="w-full h-auto"
          />
        </button>
        <div className="p-6 pt-4 space-y-4">
          <DialogHeader>
            <DialogTitle>Promo peluncuran — 100 siswa pertama</DialogTitle>
            <DialogDescription>
              Kelas "Memulai Bisnis Pakaian" bersama Lenny Agustin, sekarang hanya {formatRupiah(PROMO_PRICE_IDR)}.
            </DialogDescription>
          </DialogHeader>
          <Button variant="gradient" size="lg" className="w-full rounded-full" onClick={goToPromo}>
            Lihat Promonya
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PromoPopup;
