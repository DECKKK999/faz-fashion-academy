import { useEffect, useMemo, useState } from "react";
import { Star, Trash2 } from "lucide-react";
import { api, type AdminReview } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

function reviewerLabel(r: AdminReview) {
  return r.user.profile?.full_name?.trim() || r.user.email;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

const AdminReviews = () => {
  const [reviews, setReviews] = useState<AdminReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseFilter, setCourseFilter] = useState<string>("all");

  const load = async () => {
    setLoading(true);
    try {
      setReviews(await api.get<AdminReview[]>("/admin/reviews"));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const courses = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reviews) map.set(r.course.id, r.course.title);
    return Array.from(map, ([id, title]) => ({ id, title }));
  }, [reviews]);

  const filtered = useMemo(
    () => (courseFilter === "all" ? reviews : reviews.filter((r) => r.course.id === courseFilter)),
    [reviews, courseFilter]
  );

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus ulasan ini? Rating kelas akan dihitung ulang.")) return;
    try {
      await api.delete(`/admin/reviews/${id}`);
      toast({ title: "Ulasan dihapus" });
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menghapus", variant: "destructive" });
    }
  };

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl">Ulasan</h1>
          <p className="text-muted-foreground text-sm mt-2">Moderasi ulasan & rating kelas.</p>
        </div>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          className="border border-border bg-background text-sm px-3 py-2 rounded-none"
        >
          <option value="all">Semua kelas</option>
          {courses.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="border border-border/50 p-12 text-center">
          <p className="text-muted-foreground">Belum ada ulasan.</p>
        </div>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-3">Kelas</div>
            <div className="col-span-2">Pengguna</div>
            <div className="col-span-1">Rating</div>
            <div className="col-span-4">Ulasan</div>
            <div className="col-span-1">Tanggal</div>
            <div className="col-span-1 text-right">Aksi</div>
          </div>
          {filtered.map((r) => (
            <div key={r.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-start text-sm">
              <div className="col-span-3 text-foreground">{r.course.title}</div>
              <div className="col-span-2 text-muted-foreground break-all">{reviewerLabel(r)}</div>
              <div className="col-span-1 flex items-center gap-1 text-foreground">
                <Star size={13} className="text-gold fill-gold" /> {r.rating}
              </div>
              <div className="col-span-4 text-muted-foreground whitespace-pre-line">{r.body || "—"}</div>
              <div className="col-span-1 text-[11px] text-muted-foreground">{formatDate(r.created_at)}</div>
              <div className="col-span-1 flex justify-end">
                <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
