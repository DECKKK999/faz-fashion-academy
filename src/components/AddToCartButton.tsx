import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ApiError, type ProductType } from "@/lib/api";
import { useCart } from "@/contexts/CartContext";

type AddToCartButtonProps = {
  product_type: ProductType;
  product_id: string;
  className?: string;
  label?: string;
  // true → tampilkan tombol kecil (untuk kartu katalog)
  compact?: boolean;
};

// Tombol "Tambah ke Keranjang". Saat sudah di keranjang, menjadi tautan ke /keranjang.
const AddToCartButton = ({ product_type, product_id, className, label = "Tambah ke Keranjang", compact = false }: AddToCartButtonProps) => {
  const { has, add } = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const inCart = has(product_type, product_id);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCart) {
      navigate("/keranjang");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      await add(product_type, product_id);
      toast.success("Ditambahkan ke keranjang");
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.info(err.message);
      } else {
        toast.error(err instanceof Error ? err.message : "Gagal menambah ke keranjang");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={busy}
      size={compact ? "sm" : "default"}
      variant={inCart ? "outline" : "default"}
      className={className}
    >
      {inCart ? <Check size={compact ? 13 : 16} /> : <ShoppingBag size={compact ? 13 : 16} />}
      {inCart ? "Di Keranjang" : busy ? "Menambah..." : label}
    </Button>
  );
};

export default AddToCartButton;
