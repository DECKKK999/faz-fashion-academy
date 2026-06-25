import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Trash2, ShoppingBag, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import type { ProductType } from "@/lib/api";

const typeLabel: Record<ProductType, string> = { course: "Kelas", ebook: "E-Book", event: "Event" };

function detailPath(product_type: ProductType, slug?: string) {
  if (!slug) return undefined;
  if (product_type === "course") return `/kelas/${slug}`;
  if (product_type === "ebook") return `/ebook/${slug}`;
  return `/event/${slug}`;
}

const Cart = () => {
  const { items, total_idr, loading, remove, checkout } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await remove(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus item");
    } finally {
      setRemoving(null);
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      navigate(`/masuk?redirect=${encodeURIComponent("/keranjang")}`);
      return;
    }
    if (items.length === 0) return;
    setCheckingOut(true);
    try {
      const group = await checkout();
      if (!group.order_group_id || group.orders.length === 0) {
        // Semua item gratis / langsung diberikan.
        toast.success("Akses berhasil diberikan!");
        navigate("/dashboard");
        return;
      }
      navigate(`/checkout-group/${group.order_group_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memproses checkout");
    } finally {
      setCheckingOut(false);
    }
  };

  const hasStale = items.some((i) => i.stale_price);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title="Keranjang" description="Keranjang belanja FAZ Academy." />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link to="/kelas" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Lanjut Belanja
          </Link>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">Keranjang</h1>

          {loading ? (
            <p className="text-muted-foreground text-sm">Memuat keranjang...</p>
          ) : items.length === 0 ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <ShoppingBag className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground mb-5">Keranjang kamu masih kosong.</p>
              <Button asChild><Link to="/kelas">Jelajahi Kelas</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => {
                  const path = detailPath(item.product_type, item.slug);
                  return (
                    <div key={item.id} className="border border-border rounded-lg p-4 flex items-center gap-4">
                      <img src={item.cover_snapshot ?? ""} alt="" className="w-20 h-14 object-cover rounded bg-muted shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-[9px] tracking-editorial uppercase text-muted-foreground">{typeLabel[item.product_type]}</span>
                        {path ? (
                          <Link to={path} className="block font-medium text-foreground hover:text-accent transition-colors truncate">{item.title_snapshot}</Link>
                        ) : (
                          <p className="font-medium text-foreground truncate">{item.title_snapshot}</p>
                        )}
                        <p className="text-sm text-accent mt-1">{item.price_idr > 0 ? formatRupiah(item.price_idr) : "Gratis"}</p>
                        {item.stale_price && (
                          <p className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                            <AlertTriangle size={11} /> Harga telah diperbarui
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing === item.id}
                        aria-label="Hapus"
                        className="text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50 shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Ringkasan */}
              <div className="lg:col-span-1">
                <div className="border border-border rounded-lg p-6 sticky top-24">
                  <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-4">Ringkasan</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">{items.length} item</span>
                    <span className="text-foreground">{formatRupiah(total_idr)}</span>
                  </div>
                  <div className="border-t border-border my-4" />
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-xl font-serif font-bold text-foreground">{formatRupiah(total_idr)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-5">Kode unik per pesanan ditambahkan saat checkout.</p>
                  {hasStale && (
                    <p className="text-[11px] text-amber-600 mb-3 flex items-center gap-1">
                      <AlertTriangle size={12} /> Beberapa harga telah berubah.
                    </p>
                  )}
                  <Button className="w-full" onClick={handleCheckout} disabled={checkingOut || items.length === 0}>
                    {checkingOut ? "Memproses..." : "Checkout"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Cart;
