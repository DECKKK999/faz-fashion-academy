import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Course } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

const CoursesSection = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    api
      .get<Course[]>("/courses")
      .then((data) => {
        // "Kelas Populer" = 3 kelas dengan siswa terbanyak
        const popular = [...data].sort((a, b) => b.students_count - a.students_count).slice(0, 3);
        setCourses(popular);
      })
      .catch(() => {});
  }, []);

  return (
    <section className="py-32 px-6 md:px-16">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl md:text-4xl font-light text-foreground tracking-normal">
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
            <Link key={course.id} to="/kelas" className="group">
              <div className="overflow-hidden mb-5 relative">
                <img
                  src={course.cover_image_url ?? ""}
                  alt={course.title}
                  className="w-full aspect-[2/1] object-cover group-hover:scale-105 transition-transform duration-700 grayscale group-hover:grayscale-0"
                  loading="lazy"
                  width={700}
                  height={350}
                />
                {course.category && (
                  <span className="absolute bottom-3 left-3 bg-background/80 text-foreground text-[10px] tracking-editorial uppercase px-3 py-1 backdrop-blur-sm">
                    {course.category}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-light tracking-editorial uppercase text-foreground mb-2 group-hover:text-accent transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 normal-case" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
                {course.description}
              </p>
              <p className="text-sm font-medium text-accent normal-case" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
                {formatRupiah(course.price_idr)}
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
