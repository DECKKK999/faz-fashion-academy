import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import WishlistButton from "@/components/WishlistButton";
import AddToCartButton from "@/components/AddToCartButton";
import { api, ApiError, type Ebook } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

const EbookDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<Ebook>(`/ebooks/slug/${slug}`)
      .then(setEbook)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm tracking-editorial uppercase">Memuat...</div>
      </div>
    );
  }

  if (notFound || !ebook) {
    return (
      <div className="min-h-screen bg-background">
        <SeoHead title="E-Book tidak ditemukan" />
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">E-book tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/ebook">Kembali ke E-Book</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isFree = ebook.price_idr <= 0;

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={ebook.title}
        description={ebook.description ?? `E-book ${ebook.title}${ebook.author ? ` oleh ${ebook.author}` : ""} di FAZ Academy.`}
        image={ebook.cover_image_url ?? undefined}
      />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-6 md:px-16 max-w-5xl">
          <Link to="/ebook" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft size={13} /> E-Book
          </Link>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
            {/* Cover */}
            <div className="relative">
              <div className="aspect-[3/4] bg-muted overflow-hidden">
                <img src={ebook.cover_image_url ?? ""} alt={ebook.title} className="w-full h-full object-cover" />
              </div>
              <WishlistButton
                product_type="ebook"
                product_id={ebook.id}
                size={18}
                className="absolute top-3 right-3 w-9 h-9 bg-background/80 backdrop-blur-sm"
              />
            </div>

            {/* Info */}
            <div>
              {ebook.category && (
                <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">{ebook.category}</span>
              )}
              <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mt-2 mb-4 leading-tight">{ebook.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
                {ebook.author && (
                  <span className="flex items-center gap-1.5"><User size={14} /> {ebook.author}</span>
                )}
                {ebook.pages ? (
                  <span className="flex items-center gap-1.5"><BookOpen size={14} /> {ebook.pages} halaman</span>
                ) : null}
              </div>

              {ebook.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">{ebook.description}</p>
              )}

              <div className="border-t border-border pt-6">
                <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-1">Harga</p>
                <p className="text-2xl font-serif font-bold text-accent mb-6">{isFree ? "Gratis" : formatRupiah(ebook.price_idr)}</p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild className="flex-1">
                    <Link to={`/beli-ebook/${ebook.id}`}>{isFree ? "Ambil E-Book" : "Beli E-Book"}</Link>
                  </Button>
                  {!isFree && (
                    <AddToCartButton product_type="ebook" product_id={ebook.id} className="flex-1 gap-2" label="Tambah ke Keranjang" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EbookDetail;
