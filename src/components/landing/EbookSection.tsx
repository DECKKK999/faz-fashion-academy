import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Ebook } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

const EbookSection = () => {
  const [ebooks, setEbooks] = useState<Ebook[]>([]);

  useEffect(() => {
    api
      .get<Ebook[]>("/ebooks")
      .then((data) => setEbooks(data.slice(0, 6)))
      .catch(() => {});
  }, []);

  return (
    <section className="py-32 px-6 md:px-16 bg-secondary">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="text-2xl md:text-4xl font-light text-foreground tracking-normal">
              E-Book Collection
            </h2>
            <p
              className="text-sm text-muted-foreground mt-3 max-w-md"
              style={{ letterSpacing: "normal", textTransform: "none" }}
            >
              Koleksi e-book eksklusif dari praktisi dan pakar fashion Indonesia.
            </p>
          </div>
          <Link
            to="/ebook"
            className="hidden md:flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        <div className="border-t border-border pt-3 mb-10">
          <span className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground">
            {ebooks.length} E-Book Tersedia
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {ebooks.map((ebook) => (
            <Link key={ebook.id} to="/ebook" className="group">
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
              <div className="flex items-center justify-between">
                <p
                  className="text-[11px] font-medium text-accent"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  {formatRupiah(ebook.price_idr)}
                </p>
                {ebook.pages ? <span className="text-[9px] text-muted-foreground">{ebook.pages} hal</span> : null}
              </div>
            </Link>
          ))}
        </div>

        <div className="md:hidden text-center mt-12">
          <Link
            to="/ebook"
            className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat semua e-book <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default EbookSection;
