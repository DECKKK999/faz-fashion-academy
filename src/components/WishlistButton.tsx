import { useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { useWishlist } from "@/contexts/WishlistContext";
import type { ProductType } from "@/lib/api";

type WishlistButtonProps = {
  product_type: ProductType;
  product_id: string;
  className?: string;
  size?: number;
  // "icon" = tombol bulat ikon saja; "full" = ikon + label.
  variant?: "icon" | "full";
};

// Tombol toggle wishlist (hati). Bekerja untuk tamu (localStorage) & user (server).
const WishlistButton = ({ product_type, product_id, className, size = 16, variant = "icon" }: WishlistButtonProps) => {
  const { has, toggle } = useWishlist();
  const [busy, setBusy] = useState(false);
  const active = has(product_type, product_id);

  const onClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    setBusy(true);
    try {
      await toggle(product_type, product_id);
      toast.success(active ? "Dihapus dari wishlist" : "Ditambahkan ke wishlist");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal memperbarui wishlist");
    } finally {
      setBusy(false);
    }
  };

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={busy}
        aria-pressed={active}
        aria-label={active ? "Hapus dari wishlist" : "Tambah ke wishlist"}
        className={`inline-flex items-center justify-center gap-2 text-[11px] tracking-editorial uppercase border transition-colors disabled:opacity-60 ${
          active ? "border-foreground/40 text-foreground" : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
        } ${className ?? ""}`}
      >
        <Heart size={size} className={active ? "fill-current" : ""} />
        {active ? "Tersimpan" : "Wishlist"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      aria-pressed={active}
      aria-label={active ? "Hapus dari wishlist" : "Tambah ke wishlist"}
      className={`inline-flex items-center justify-center rounded-full transition-colors disabled:opacity-60 ${
        active ? "text-red-500" : "text-muted-foreground hover:text-foreground"
      } ${className ?? ""}`}
    >
      <Heart size={size} className={active ? "fill-current" : ""} />
    </button>
  );
};

export default WishlistButton;
