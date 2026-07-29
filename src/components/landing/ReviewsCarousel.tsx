import { useEffect, useState } from "react";
import { api, type Course, type CourseReviewsResponse, type Review } from "@/lib/api";
import Kicker from "@/components/landing/Kicker";
import StarRatingInput from "@/components/course/StarRatingInput";

/**
 * Sliding review strip — real reviews pulled across every published course
 * (no site-wide reviews endpoint exists, so this aggregates the per-course
 * one). Hides itself if there's nothing to show yet, same guard pattern as
 * PromoSection/StatsStrip.
 */
const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<Course[]>("/courses")
      .then(async (courses) => {
        const perCourse = await Promise.all(
          courses.map((c) =>
            api.get<CourseReviewsResponse>(`/courses/${c.id}/reviews`).catch(() => ({ reviews: [] as Review[] })),
          ),
        );
        const withText = perCourse
          .flatMap((r) => r.reviews)
          .filter((r) => (r.body?.length ?? 0) > 0)
          .sort((a, b) => b.rating - a.rating);
        if (active) setReviews(withText);
      })
      .catch(() => active && setReviews([]));
    return () => {
      active = false;
    };
  }, []);

  if (!reviews || reviews.length === 0) return null;

  // Dobel array-nya supaya loop marquee-nya mulus (paruh pertama tepat menyambung paruh kedua).
  const items = [...reviews, ...reviews];

  return (
    <section className="py-16 border-y border-border overflow-hidden">
      <div className="flex justify-center mb-10 px-6">
        <Kicker>Kata Mereka</Kicker>
      </div>
      <div className="relative [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex gap-5 w-max animate-marquee-right hover:[animation-play-state:paused]">
          {items.map((r, i) => (
            <div key={`${r.id}-${i}`} className="glass-panel rounded-2xl p-6 w-80 shrink-0 shadow-lg">
              <StarRatingInput value={r.rating} readOnly size={14} className="mb-3" />
              <p className="font-serif italic text-foreground text-[15px] leading-relaxed line-clamp-4">
                &ldquo;{r.body}&rdquo;
              </p>
              <p className="mt-4 text-[11px] tracking-editorial uppercase text-muted-foreground">
                {r.reviewer?.full_name ?? "Siswa FAZ Academy"}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ReviewsCarousel;
