import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock, Users, Star, Search } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useMemo, useState } from "react";
import { api, type Course } from "@/lib/api";
import { formatRupiah, formatDuration, formatCount } from "@/lib/format";

const Kelas = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<Course[]>("/courses")
      .then(setCourses)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(courses.map((c) => c.category).filter(Boolean))) as string[];
    return ["Semua", ...cats];
  }, [courses]);

  const filtered = courses.filter((c) => {
    const matchCategory = activeCategory === "Semua" || c.category === activeCategory;
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
              Courses & Programs
            </p>
            <h1 className="text-4xl md:text-5xl font-serif italic text-foreground mb-4">
              Katalog Kelas
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
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
                key={course.id}
                className="group bg-card rounded-lg overflow-hidden border border-border hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <Link to={`/kelas/${course.slug}`} className="relative overflow-hidden block">
                  <img
                    src={course.cover_image_url ?? ""}
                    alt={course.title}
                    className="w-full aspect-[2/1] object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    width={700}
                    height={350}
                  />
                  {course.category && (
                    <span className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                      {course.category}
                    </span>
                  )}
                  {course.level && (
                    <span className="absolute top-3 right-3 bg-card/90 text-foreground text-xs px-2 py-1 rounded-full">
                      {course.level}
                    </span>
                  )}
                </Link>
                <div className="p-5">
                  <Link to={`/kelas/${course.slug}`}>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors">
                      {course.title}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                    {course.duration_minutes ? (
                      <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(course.duration_minutes)}</span>
                    ) : null}
                    <span className="flex items-center gap-1"><Users size={12} /> {formatCount(course.students_count)}</span>
                    {course.rating ? (
                      <span className="flex items-center gap-1"><Star size={12} className="text-gold" /> {course.rating}</span>
                    ) : null}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-primary">{course.price_idr ? formatRupiah(course.price_idr) : "Gratis"}</p>
                    <Button size="sm" asChild><Link to={`/kelas/${course.slug}`}>Lihat</Link></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {loading && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-sm">Memuat kelas...</p>
            </div>
          )}

          {!loading && filtered.length === 0 && (
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
