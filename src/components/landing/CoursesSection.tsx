import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Clock, Users, Star } from "lucide-react";

const courses = [
  {
    title: "Desain Busana Dasar",
    category: "Desain",
    price: "Rp 299.000",
    duration: "12 jam",
    students: "1,200",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=300&fit=crop",
  },
  {
    title: "Fashion Marketing Digital",
    category: "Marketing",
    price: "Rp 399.000",
    duration: "8 jam",
    students: "890",
    rating: "4.8",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
  },
  {
    title: "Pattern Making & Draping",
    category: "Teknik",
    price: "Rp 499.000",
    duration: "16 jam",
    students: "650",
    rating: "4.9",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=300&fit=crop",
  },
  {
    title: "Fashion Illustration",
    category: "Desain",
    price: "Rp 349.000",
    duration: "10 jam",
    students: "1,500",
    rating: "4.7",
    image: "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=300&fit=crop",
  },
];

const CoursesSection = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary text-sm tracking-[0.2em] uppercase mb-3 font-sans">Kelas Populer</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Pelajari Keahlian Fashion Terkini
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Kurikulum dirancang oleh praktisi industri fashion dengan pengalaman bertahun-tahun.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link
              key={course.title}
              to="/kelas"
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
                <p className="font-semibold text-primary">{course.price}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-10">
          <Button variant="outline" size="lg" asChild>
            <Link to="/kelas">Lihat Semua Kelas</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
