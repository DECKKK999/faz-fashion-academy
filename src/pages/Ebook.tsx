import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = ["Semua", "Teknik", "Ilustrasi", "Sustainability", "Material", "Bisnis", "Desain"];

const allEbooks = [
  {
    title: "The Art of Pattern Making",
    author: "Rina Setiawan",
    category: "Teknik",
    price: "Rp 89.000",
    pages: 142,
    description: "Panduan lengkap teknik pembuatan pola dari dasar hingga mahir.",
    image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=800&fit=crop",
  },
  {
    title: "Fashion Illustration Masterclass",
    author: "Dian Pratama",
    category: "Ilustrasi",
    price: "Rp 129.000",
    pages: 210,
    description: "Kuasai seni ilustrasi fashion dari sketsa hingga rendering digital.",
    image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600&h=800&fit=crop",
  },
  {
    title: "Sustainable Fashion Guide",
    author: "Maya Anggraini",
    category: "Sustainability",
    price: "Rp 79.000",
    pages: 98,
    description: "Membangun brand fashion yang berkelanjutan dan ramah lingkungan.",
    image: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=600&h=800&fit=crop",
  },
  {
    title: "Textile & Material Science",
    author: "Andi Wibowo",
    category: "Material",
    price: "Rp 149.000",
    pages: 186,
    description: "Ilmu tekstil dan material untuk desainer fashion profesional.",
    image: "https://images.unsplash.com/photo-1553729459-ade2d1e6b8a0?w=600&h=800&fit=crop",
  },
  {
    title: "Fashion Business Blueprint",
    author: "Sarah Kartika",
    category: "Bisnis",
    price: "Rp 99.000",
    pages: 164,
    description: "Strategi membangun bisnis fashion dari nol hingga sukses.",
    image: "https://images.unsplash.com/photo-1589998059171-988d887df646?w=600&h=800&fit=crop",
  },
  {
    title: "Color Theory for Fashion",
    author: "Budi Hartono",
    category: "Desain",
    price: "Rp 69.000",
    pages: 112,
    description: "Teori warna dan aplikasinya dalam desain busana kontemporer.",
    image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600&h=800&fit=crop",
  },
  {
    title: "Draping Fundamentals",
    author: "Lina Kusuma",
    category: "Teknik",
    price: "Rp 119.000",
    pages: 156,
    description: "Teknik draping klasik dan modern untuk busana haute couture.",
    image: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=600&h=800&fit=crop",
  },
  {
    title: "Fashion Branding Essentials",
    author: "Reza Firmansyah",
    category: "Bisnis",
    price: "Rp 109.000",
    pages: 134,
    description: "Membangun identitas brand fashion yang kuat dan berkesan.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop",
  },
];

const Ebook = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = allEbooks.filter((e) => {
    const matchCategory = activeCategory === "Semua" || e.category === activeCategory;
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) || e.author.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-7xl">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-5xl font-light text-foreground tracking-editorial">
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
              <div key={ebook.title} className="group">
                <div className="overflow-hidden mb-4 relative bg-muted aspect-[3/4]">
                  <img
                    src={ebook.image}
                    alt={ebook.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                    loading="lazy"
                    width={600}
                    height={800}
                  />
                  <span className="absolute top-2 left-2 bg-background/80 text-foreground text-[9px] tracking-editorial uppercase px-2 py-0.5 backdrop-blur-sm">
                    {ebook.category}
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
                    {ebook.price}
                  </p>
                  <span className="flex items-center gap-1 text-[9px] text-muted-foreground">
                    <BookOpen size={10} /> {ebook.pages} hal
                  </span>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
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
