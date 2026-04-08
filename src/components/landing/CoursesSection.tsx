import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const courses = [
  {
    title: "Fashion Design",
    tag: "Desain",
    description: "Pelajari fondasi desain busana dari sketsa hingga prototipe.",
    price: "Rp 299.000",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=700&h=500&fit=crop",
  },
  {
    title: "Fashion Marketing & Communication",
    tag: "Marketing",
    description: "Strategi pemasaran digital khusus industri fashion.",
    price: "Rp 399.000",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&h=500&fit=crop",
  },
  {
    title: "Pattern Making & Draping",
    tag: "Teknik",
    description: "Teknik pembuatan pola dan draping profesional.",
    price: "Rp 499.000",
    image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=700&h=500&fit=crop",
  },
];

const CoursesSection = () => {
  return (
    <section className="py-32 px-6 md:px-16">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl md:text-4xl font-light text-foreground tracking-editorial">
            Kelas Populer
          </h2>
          <Link
            to="/kelas"
            className="hidden md:flex items-center gap-2 text-[13px] tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat semua <ArrowRight size={12} />
          </Link>
        </div>

        <div className="border-t border-border pt-3 mb-10">
          <span className="text-[12px] tracking-wide-editorial uppercase text-muted-foreground">
            {courses.length} Kelas Tersedia
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link key={course.title} to="/kelas" className="group">
              <div className="overflow-hidden mb-5 relative">
                <img
                  src={course.image}
                  alt={course.title}
                  className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                  loading="lazy"
                  width={700}
                  height={500}
                />
                <span className="absolute bottom-3 left-3 bg-background/80 text-foreground text-[10px] tracking-editorial uppercase px-3 py-1 backdrop-blur-sm">
                  {course.tag}
                </span>
              </div>
              <h3 className="text-sm font-light tracking-editorial uppercase text-foreground mb-2 group-hover:text-accent transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 normal-case" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
                {course.description}
              </p>
              <p className="text-sm font-medium text-accent normal-case" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
                {course.price}
              </p>
            </Link>
          ))}
        </div>

        <div className="md:hidden text-center mt-12">
          <Link
            to="/kelas"
            className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Lihat semua kelas <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
