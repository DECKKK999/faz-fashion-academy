import { Link } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/contexts/CartContext";

// Ikon keranjang dengan badge jumlah item → /keranjang.
const CartButton = ({ className }: { className?: string }) => {
  const { count } = useCart();
  return (
    <Link
      to="/keranjang"
      aria-label="Keranjang"
      className={`relative inline-flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors ${className ?? ""}`}
    >
      <ShoppingBag size={18} />
      {count > 0 && (
        <span className="absolute -top-2 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-foreground text-background text-[9px] font-medium flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
};

export default CartButton;
