import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type Ebook as EbookType } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import WishlistButton from "@/components/WishlistButton";

const Ebook = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [ebooks, setEbooks] = useState<EbookType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<EbookType[]>("/ebooks")
      .then(setEbooks)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(ebooks.map((e) => e.category).filter(Boolean))) as string[];
    return ["Semua", ...cats];
  }, [ebooks]);

  const filtered = ebooks.filter((e) => {
    const matchCategory = activeCategory === "Semua" || e.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch =
      e.title.toLowerCase().includes(q) || (e.author ?? "").toLowerCase().includes(q);
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-5xl font-light text-foreground tracking-normal">
              E-Book Collection
            </h1>
            <p
              className="text-sm text-muted-foreground mt-3 max-w-lg"
              style={{ letterSpacing: "normal", textTransform: "none" }}
            >
              Koleksi e-book eksklusif dari praktisi dan pakar fashion Indonesia.
            </p>
          </div>

          <div className="border-t border-border pt-3 mb-10">
            <span className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground">
              {filtered.length} E-Book Tersedia
            </span>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between mb-12">
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-[10px] tracking-editorial uppercase px-4 py-2 border transition-colors ${
                    activeCategory === cat
                      ? "bg-foreground/10 border-foreground/30 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
              <Input
                placeholder="Cari e-book..."
                className="pl-9 h-9 text-sm bg-secondary border-border rounded-none"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {filtered.map((ebook) => (
              <Link to={`/ebook/${ebook.slug}`} key={ebook.id} className="group block">
                <div className="overflow-hidden mb-4 relative bg-muted aspect-[3/4]">
                  <img
                    src={ebook.cover_image_url ?? ""}
                    alt={ebook.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                    loading="lazy"
                    width={600}
                    height={800}
                  />
                  {ebook.category && (
                    <span className="absolute top-2 left-2 bg-background/80 text-foreground text-[9px] tracking-editorial uppercase px-2 py-0.5 backdrop-blur-sm">
                      {ebook.category}
                    </span>
                  )}
                  <span className="absolute top-2 right-2 bg-background/80 rounded-full p-1 backdrop-blur-sm">
                    <WishlistButton product_type="ebook" product_id={ebook.id} size={14} />
                  </span>
                </div>
                <h3 className="text-[11px] font-light tracking-editorial uppercase text-foreground mb-1 group-hover:text-accent transition-colors leading-tight">
                  {ebook.title}
                </h3>
                <p
                  className="text-[11px] text-muted-foreground mb-1"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  {ebook.author}
                </p>
                <p
                  className="text-[10px] text-muted-foreground mb-2 line-clamp-2"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  {ebook.description}
                </p>
                <div className="flex items-center justify-between">
                  <p
                    className="text-[11px] font-medium text-accent"
                    style={{ letterSpacing: "normal", textTransform: "none" }}
                  >
                    {formatRupiah(ebook.price_idr)}
                  </p>
                  {ebook.pages ? (
                    <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                      <BookOpen size={10} /> {ebook.pages} hal
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>

          {loading && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm" style={{ letterSpacing: "normal", textTransform: "none" }}>
                Memuat e-book...
              </p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <p className="text-muted-foreground text-sm" style={{ letterSpacing: "normal", textTransform: "none" }}>
                Tidak ada e-book yang ditemukan.
              </p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Ebook;
