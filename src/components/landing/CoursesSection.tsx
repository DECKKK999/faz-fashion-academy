import { Link } from "react-router-dom";
import { ArrowRight, Clock, Users, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Course } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDuration, formatCount } from "@/lib/format";
import { PROMO_PRICE_IDR, isPromoCourse } from "@/lib/promo";

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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {courses.map((course) => (
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
              </Link>
              <div className="p-5">
                {(course.category || course.level) && (
                  <div className="flex items-center gap-2 mb-3">
                    {course.category && (
                      <span className="bg-primary text-primary-foreground text-xs px-3 py-1 rounded-full font-medium">
                        {course.category}
                      </span>
                    )}
                    {course.level && (
                      <span className="bg-muted text-foreground text-xs px-2 py-1 rounded-full">
                        {course.level}
                      </span>
                    )}
                  </div>
                )}
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
                  <div>
                    {isPromoCourse(course.slug) && course.price_idr > 0 && (
                      <p className="text-[11px] text-muted-foreground line-through leading-none">{formatRupiah(course.price_idr)}</p>
                    )}
                    <p className="font-semibold text-primary">
                      {course.price_idr ? formatRupiah(isPromoCourse(course.slug) ? PROMO_PRICE_IDR : course.price_idr) : "Gratis"}
                    </p>
                  </div>
                  <Button size="sm" asChild><Link to={`/kelas/${course.slug}`}>Lihat</Link></Button>
                </div>
              </div>
            </div>
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
