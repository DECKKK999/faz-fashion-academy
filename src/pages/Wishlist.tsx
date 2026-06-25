import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Trash2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import AddToCartButton from "@/components/AddToCartButton";
import { useWishlist } from "@/contexts/WishlistContext";
import { formatRupiah } from "@/lib/format";
import { toast } from "sonner";
import type { ProductType } from "@/lib/api";

const typeLabel: Record<ProductType, string> = { course: "Kelas", ebook: "E-Book", event: "Event" };

function detailPath(product_type: ProductType, slug: string) {
  if (product_type === "course") return `/kelas/${slug}`;
  if (product_type === "ebook") return `/ebook/${slug}`;
  return `/event/${slug}`;
}

const Wishlist = () => {
  const { items, loading, remove } = useWishlist();
  const [removing, setRemoving] = useState<string | null>(null);

  const handleRemove = async (id: string) => {
    setRemoving(id);
    try {
      await remove(id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title="Wishlist" description="Daftar keinginan produk FAZ Academy." />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <Link to="/kelas" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft size={13} /> Lanjut Belanja
          </Link>

          <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mb-8">Wishlist</h1>

          {loading ? (
            <p className="text-muted-foreground text-sm">Memuat wishlist...</p>
          ) : items.length === 0 ? (
            <div className="border border-border rounded-lg p-12 text-center">
              <Heart className="mx-auto text-muted-foreground mb-3" size={32} />
              <p className="text-muted-foreground mb-5">Wishlist kamu masih kosong.</p>
              <Button asChild><Link to="/kelas">Jelajahi Kelas</Link></Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <div key={item.id} className="border border-border rounded-lg overflow-hidden group">
                  <Link to={detailPath(item.product_type, item.slug)} className="block aspect-[16/10] overflow-hidden bg-muted">
                    <img src={item.cover_image_url ?? ""} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  </Link>
                  <div className="p-4">
                    <span className="text-[9px] tracking-editorial uppercase text-muted-foreground">{typeLabel[item.product_type]}</span>
                    <Link to={detailPath(item.product_type, item.slug)} className="block font-medium text-foreground hover:text-accent transition-colors leading-tight mt-1 mb-2">
                      {item.title}
                    </Link>
                    <p className="text-sm text-accent mb-4">{item.price_idr > 0 ? formatRupiah(item.price_idr) : "Gratis"}</p>
                    <div className="flex items-center gap-2">
                      <AddToCartButton product_type={item.product_type} product_id={item.product_id} compact className="flex-1 gap-1.5" label="Keranjang" />
                      <button
                        onClick={() => handleRemove(item.id)}
                        disabled={removing === item.id}
                        aria-label="Hapus dari wishlist"
                        className="p-2 text-muted-foreground hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Wishlist;
