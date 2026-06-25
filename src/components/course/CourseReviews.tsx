import { useEffect, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { api, ApiError, type CourseReviewsResponse, type Review, type ReviewAggregate } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import StarRatingInput from "@/components/course/StarRatingInput";

type Props = {
  courseId: string;
  canReview: boolean;
};

const EMPTY_AGGREGATE: ReviewAggregate = {
  average: null,
  count: 0,
  distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
  } catch {
    return "";
  }
}

const CourseReviews = ({ courseId, canReview }: Props) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [aggregate, setAggregate] = useState<ReviewAggregate>(EMPTY_AGGREGATE);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(true);

  // form state
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get<CourseReviewsResponse>(`/courses/${courseId}/reviews`);
      setReviews(data.reviews);
      setAggregate(data.aggregate);
      setMyReview(data.my_review);
      if (data.my_review) {
        setRating(data.my_review.rating);
        setBody(data.my_review.body ?? "");
      } else {
        setRating(0);
        setBody("");
      }
    } catch {
      // keep empty state on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, user]);

  const handleSubmit = async () => {
    if (rating < 1) {
      toast.error("Pilih rating bintang terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      await api.post<Review>(`/courses/${courseId}/reviews`, {
        rating,
        body: body.trim() ? body.trim() : null,
      });
      toast.success(myReview ? "Ulasan diperbarui" : "Terima kasih atas ulasanmu");
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal mengirim ulasan";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Hapus ulasanmu?")) return;
    setSubmitting(true);
    try {
      await api.delete(`/courses/${courseId}/reviews/me`);
      toast.success("Ulasan dihapus");
      await load();
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Gagal menghapus ulasan";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const distMax = Math.max(1, ...(["5", "4", "3", "2", "1"] as const).map((k) => aggregate.distribution[k]));

  return (
    <section className="mt-12 pt-10 border-t border-border">
      <h2 className="font-serif text-2xl font-semibold text-foreground mb-6">Ulasan</h2>

      {/* Aggregate */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-10">
        <div className="text-center sm:text-left">
          <p className="text-5xl font-serif font-bold text-foreground">
            {aggregate.average != null ? aggregate.average.toFixed(1) : "—"}
          </p>
          <div className="mt-2 flex justify-center sm:justify-start">
            <StarRatingInput value={Math.round(aggregate.average ?? 0)} readOnly size={18} />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {aggregate.count} ulasan
          </p>
        </div>
        <div className="sm:col-span-2 space-y-1.5">
          {(["5", "4", "3", "2", "1"] as const).map((k) => (
            <div key={k} className="flex items-center gap-3 text-xs">
              <span className="w-10 flex items-center gap-1 text-muted-foreground">
                {k} <Star size={11} className="text-gold fill-gold" />
              </span>
              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gold rounded-full transition-all"
                  style={{ width: `${(aggregate.distribution[k] / distMax) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-muted-foreground">{aggregate.distribution[k]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Review form (only for enrolled users) */}
      {canReview ? (
        <div className="border border-border rounded-lg p-6 mb-10 bg-card">
          <p className="text-sm font-medium text-foreground mb-3">
            {myReview ? "Edit ulasanmu" : "Tulis ulasan"}
          </p>
          <StarRatingInput value={rating} onChange={setRating} size={28} className="mb-4" />
          <Textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Bagikan pengalamanmu mengikuti kelas ini (opsional)"
            rows={4}
            maxLength={2000}
            className="mb-4"
          />
          <div className="flex items-center gap-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {myReview ? "Perbarui Ulasan" : "Kirim Ulasan"}
            </Button>
            {myReview && (
              <Button variant="outline" onClick={handleDelete} disabled={submitting} className="gap-2">
                <Trash2 size={14} /> Hapus
              </Button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mb-10">
          Hanya peserta kelas ini yang dapat memberi ulasan.
        </p>
      )}

      {/* Review list */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Memuat ulasan...</p>
      ) : reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada ulasan untuk kelas ini.</p>
      ) : (
        <div className="space-y-6">
          {reviews.map((r) => (
            <div key={r.id} className="flex gap-4">
              <div className="w-10 h-10 rounded-full bg-muted overflow-hidden flex items-center justify-center text-foreground text-sm font-medium shrink-0">
                {r.reviewer?.avatar_url ? (
                  <img src={r.reviewer.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  (r.reviewer?.full_name ?? "?").charAt(0).toUpperCase()
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-foreground">{r.reviewer?.full_name ?? "Pengguna"}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDate(r.created_at)}</p>
                </div>
                <div className="mt-1 mb-2">
                  <StarRatingInput value={r.rating} readOnly size={14} />
                </div>
                {r.body && <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{r.body}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default CourseReviews;
