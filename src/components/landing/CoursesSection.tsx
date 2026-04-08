import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const courses = [
  { title: "Fashion Design", tag: "Desain", description: "Pelajari fondasi desain busana dari sketsa hingga prototipe.", price: "Rp 299.000", image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=700&h=500&fit=crop" },
  { title: "Fashion Marketing & Communication", tag: "Marketing", description: "Strategi pemasaran digital khusus industri fashion.", price: "Rp 399.000", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=700&h=500&fit=crop" },
  { title: "Pattern Making & Draping", tag: "Teknik", description: "Teknik pembuatan pola dan draping profesional.", price: "Rp 499.000", image: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=700&h=500&fit=crop" },
];

const CoursesSection = () => {
  return (
    <section className="py-32 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-6">
          <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight">
            Kelas Populer
          </h2>
          <Link to="/kelas" className="hidden md:flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Lihat semua <ArrowRight size={14} />
          </Link>
        </div>
        <div className="border-t border-foreground/10 pt-2 mb-8">
          <span className="inline-block bg-foreground text-background text-xs font-medium px-3 py-1 rounded-full">
            {courses.length} KELAS
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.title} to="/kelas" className="group">
              <div className="overflow-hidden rounded-lg mb-4 relative">
                <img src={course.image} alt={course.title} className="w-full aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700" loading="lazy" width={700} height={500} />
                <span className="absolute bottom-3 left-3 bg-background/90 text-foreground text-xs px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                  {course.tag}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-muted-foreground transition-colors leading-tight">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
              <p className="text-sm font-medium text-foreground">{course.price}</p>
            </Link>
          ))}
        </div>
        <div className="md:hidden text-center mt-10">
          <Link to="/kelas" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            Lihat semua kelas <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CoursesSection;
