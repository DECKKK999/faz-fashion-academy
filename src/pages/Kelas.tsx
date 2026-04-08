import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Users, Star, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useState } from "react";

const categories = ["Semua", "Desain", "Marketing", "Teknik", "Bisnis", "Styling"];

const allCourses = [
  { title: "Desain Busana Dasar", category: "Desain", price: "Rp 299.000", duration: "12 jam", students: "1,200", rating: "4.9", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop", level: "Pemula" },
  { title: "Fashion Marketing Digital", category: "Marketing", price: "Rp 399.000", duration: "8 jam", students: "890", rating: "4.8", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop", level: "Menengah" },
  { title: "Pattern Making & Draping", category: "Teknik", price: "Rp 499.000", duration: "16 jam", students: "650", rating: "4.9", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop", level: "Lanjutan" },
  { title: "Fashion Illustration", category: "Desain", price: "Rp 349.000", duration: "10 jam", students: "1,500", rating: "4.7", image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop", level: "Pemula" },
  { title: "Branding Fashion", category: "Bisnis", price: "Rp 450.000", duration: "14 jam", students: "780", rating: "4.8", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop", level: "Menengah" },
  { title: "Personal Styling", category: "Styling", price: "Rp 275.000", duration: "6 jam", students: "2,100", rating: "4.9", image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=400&h=300&fit=crop", level: "Pemula" },
  { title: "Sustainable Fashion", category: "Bisnis", price: "Rp 350.000", duration: "8 jam", students: "520", rating: "4.6", image: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=300&fit=crop", level: "Menengah" },
  { title: "Fashion Photography", category: "Marketing", price: "Rp 425.000", duration: "12 jam", students: "940", rating: "4.8", image: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=300&fit=crop", level: "Menengah" },
];

const Kelas = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");

  const filtered = allCourses.filter((c) => {
    const matchCategory = activeCategory === "Semua" || c.category === activeCategory;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold italic text-foreground mb-4">Katalog Kelas</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Temukan kelas yang sesuai dengan minat dan level keahlianmu di dunia fashion.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
            <div className="flex gap-2 flex-wrap justify-center">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat)}
                >
                  {cat}
                </Button>
              ))}
            </div>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
              <Input
                placeholder="Cari kelas..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((course) => (
              <div
                key={course.title}
                className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={course.image}
                    alt={course.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={400}
                    height={300}
                  />
                  <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                    {course.category}
                  </span>
                  <span className="absolute top-3 right-3 bg-card/90 text-foreground text-xs px-2 py-1 rounded-full">
                    {course.level}
                  </span>
                </div>
                <div className="p-5">
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {course.students}</span>
                    <span className="flex items-center gap-1"><Star size={12} className="text-gold" /> {course.rating}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primary">{course.price}</p>
                    <Button size="sm">Daftar</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg">Tidak ada kelas yang ditemukan.</p>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Kelas;
