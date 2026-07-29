import { Link } from "react-router-dom";
import { BadgePercent, Clock, Users, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { api, type Course } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { formatRupiah, formatDuration, formatCount } from "@/lib/format";
import { PROMO_PRICE_IDR, isPromoCourse } from "@/lib/promo";
import Kicker from "@/components/landing/Kicker";
import Reveal from "@/components/landing/Reveal";

const PromoSection = () => {
  const [promoCourses, setPromoCourses] = useState<Course[]>([]);

  useEffect(() => {
    api
      .get<Course[]>("/courses")
      .then((data) => setPromoCourses(data.filter((c) => isPromoCourse(c.slug))))
      .catch(() => {});
  }, []);

  if (promoCourses.length === 0) return null;

  return (
    <section className="py-32 px-6 md:px-16 bg-olive/[0.06]">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-end justify-between mb-4">
          <div>
            <Kicker index="01" tone="olive" className="mb-3">Terbatas</Kicker>
            <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-normal">
              Promo Saat Ini
            </h2>
          </div>
        </div>

        <div className="border-t border-olive/25 pt-3 mb-10">
          <span className="text-[12px] tracking-wide-editorial uppercase text-muted-foreground">
            {promoCourses.length} Promo Aktif
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {promoCourses.map((course, idx) => (
            <Reveal
              key={course.id}
              delayMs={idx * 80}
              className="group bg-olive rounded-lg overflow-hidden border border-olive-light/40 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300"
            >
              <Link to="/promo/fashion-design" className="relative overflow-hidden block">
                <span className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-white text-olive text-xs px-3 py-1 rounded-full font-medium">
                  <BadgePercent size={12} /> Promo
                </span>
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
                      <span className="bg-white/15 text-white text-xs px-3 py-1 rounded-full font-medium">
                        {course.category}
                      </span>
                    )}
                    {course.level && (
                      <span className="bg-white/15 text-white text-xs px-2 py-1 rounded-full">
                        {course.level}
                      </span>
                    )}
                  </div>
                )}
                <Link to="/promo/fashion-design">
                  <h3 className="font-serif text-lg font-semibold text-white mb-3 transition-colors">
                    {course.title}
                  </h3>
                </Link>
                <div className="flex items-center gap-4 text-xs text-white/80 mb-4">
                  {course.duration_minutes ? (
                    <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(course.duration_minutes)}</span>
                  ) : null}
                  <span className="flex items-center gap-1"><Users size={12} /> {formatCount(course.students_count)}</span>
                  {course.rating ? (
                    <span className="flex items-center gap-1"><Star size={12} className="text-white" /> {course.rating}</span>
                  ) : null}
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    {course.price_idr > 0 && (
                      <p className="text-[12px] text-white/60 line-through leading-none">{formatRupiah(course.price_idr)}</p>
                    )}
                    <p className="font-semibold text-white">{formatRupiah(PROMO_PRICE_IDR)}</p>
                  </div>
                  <Button size="sm" className="bg-white text-olive hover:bg-white/90" asChild>
                    <Link to="/promo/fashion-design">Lihat</Link>
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
