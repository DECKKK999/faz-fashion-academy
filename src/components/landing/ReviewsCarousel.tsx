import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { api, type Course, type CourseReviewsResponse, type Review } from "@/lib/api";
import Kicker from "@/components/landing/Kicker";
import StarRatingInput from "@/components/course/StarRatingInput";

/**
 * Swipeable review strip — real reviews pulled across every published course
 * (no site-wide reviews endpoint exists, so this aggregates the per-course
 * one). Hides itself if there's nothing to show yet, same guard pattern as
 * PromoSection/StatsStrip.
 *
 * Manually paced (touch swipe / trackpad / mouse-drag / arrow buttons)
 * rather than an auto-scrolling marquee — the constant motion of the old
 * version made it hard to actually read a card before it moved on. Touch
 * and trackpad get native scrolling for free; mouse users need an explicit
 * drag handler below since browsers reserve click-drag for text selection.
 */
const ReviewsCarousel = () => {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startScroll: number; dragging: boolean } | null>(null);

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

  const scrollByCard = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-review-card]");
    const step = (card?.offsetWidth ?? 320) + 20; // card width + gap
    el.scrollBy({ left: direction * step, behavior: "smooth" });
  };

  // Touch and trackpad scroll the container natively — only mouse needs an
  // explicit drag handler, since browsers treat mouse click-drag as text
  // selection by default rather than a scroll gesture.
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    const el = scrollerRef.current;
    if (!el) return;
    dragRef.current = { startX: e.clientX, startScroll: el.scrollLeft, dragging: true };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    const el = scrollerRef.current;
    if (!drag?.dragging || !el) return;
    el.scrollLeft = drag.startScroll - (e.clientX - drag.startX);
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) dragRef.current.dragging = false;
    const el = scrollerRef.current;
    if (!el) return;
    el.style.cursor = "";
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="py-16 border-y border-border overflow-hidden">
      <div className="container mx-auto max-w-7xl px-6 md:px-16 flex items-center justify-between mb-10">
        <Kicker>Kata Mereka</Kicker>
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByCard(-1)}
            aria-label="Ulasan sebelumnya"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => scrollByCard(1)}
            aria-label="Ulasan berikutnya"
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      <div
        ref={scrollerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="flex gap-5 overflow-x-auto snap-x snap-proximity scroll-smooth select-none cursor-grab px-6 md:px-16 pb-2 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {reviews.map((r) => (
          <div
            key={r.id}
            data-review-card
            className="glass-panel rounded-2xl p-6 w-80 shrink-0 shadow-lg snap-start"
          >
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
    </section>
  );
};

export default ReviewsCarousel;
