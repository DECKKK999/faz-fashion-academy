import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Plus, Trash2 } from "lucide-react";
import { api, type AdminAssignment, type AdminAssignmentSubmission } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type Course = { id: string; title: string; slug: string };

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const AdminCourseAssignment = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [assignment, setAssignment] = useState<AdminAssignment | null>(null);
  const [submissions, setSubmissions] = useState<AdminAssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fail = (e: unknown, fallback: string) =>
    toast({ title: "Error", description: e instanceof Error ? e.message : fallback, variant: "destructive" });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      setCourse(await api.get<Course>(`/courses/${id}`));
      const a = await api.get<AdminAssignment | null>(`/admin/assignments/by-course/${id}`);
      setAssignment(a);
      if (a) setSubmissions(await api.get<AdminAssignmentSubmission[]>(`/admin/assignments/${a.id}/submissions`));
    } catch (e) {
      fail(e, "Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const createAssignment = async () => {
    if (!id) return;
    try {
      setAssignment(await api.post<AdminAssignment>(`/admin/assignments/by-course/${id}`, {}));
      toast({ title: "Tugas Akhir dibuat" });
    } catch (e) {
      fail(e, "Gagal membuat tugas");
    }
  };

  const save = async () => {
    if (!assignment) return;
    setSaving(true);
    try {
      const updated = await api.patch<AdminAssignment>(`/admin/assignments/${assignment.id}`, {
        title: assignment.title,
        description: assignment.description,
        is_published: assignment.is_published,
      });
      setAssignment(updated);
      toast({ title: "Tugas Akhir disimpan" });
    } catch (e) {
      fail(e, "Gagal menyimpan tugas");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!assignment) return;
    if (!confirm("Hapus Tugas Akhir ini beserta seluruh file yang sudah dikumpulkan peserta?")) return;
    try {
      await api.delete(`/admin/assignments/${assignment.id}`);
      setAssignment(null);
      setSubmissions([]);
      toast({ title: "Tugas Akhir dihapus" });
    } catch (e) {
      fail(e, "Gagal menghapus tugas");
    }
  };

  if (loading) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-10 max-w-5xl">
      <Link
        to={`/admin/courses/${id}`}
        className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft size={13} /> Back to Course
      </Link>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Tugas Akhir</p>
          <h1 className="text-3xl">{course?.title ?? "Kelas"}</h1>
        </div>
        {assignment && (
          <Button onClick={save} disabled={saving} className="rounded-none">
            {saving ? "Saving..." : "Save Tugas"}
          </Button>
        )}
      </div>

      {!assignment ? (
        <div className="border border-dashed border-border/50 p-10 text-center">
          <p className="text-muted-foreground text-sm mb-5">
            Kelas ini belum punya Tugas Akhir. Dengan Tugas Akhir, peserta mengunggah hasil karyanya dan sertifikat
            terbuka setelah tugas dikumpulkan.
          </p>
          <Button onClick={createAssignment} className="rounded-none gap-2">
            <Plus size={14} /> Buat Tugas Akhir
          </Button>
        </div>
      ) : (
        <>
          <div className="border border-border/50 p-6 mb-10 grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Label className="text-[10px] tracking-editorial uppercase">Judul</Label>
              <Input
                value={assignment.title}
                onChange={(e) => setAssignment({ ...assignment, title: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] tracking-editorial uppercase">Instruksi untuk peserta</Label>
              <Textarea
                rows={14}
                value={assignment.description ?? ""}
                onChange={(e) => setAssignment({ ...assignment, description: e.target.value || null })}
                className="mt-1.5"
              />
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Switch
                checked={assignment.is_published}
                onCheckedChange={(v) => setAssignment({ ...assignment, is_published: v })}
              />
              <Label className="text-[11px] tracking-editorial uppercase">Aktif</Label>
            </div>
            <div className="col-span-2 border-t border-border/50 pt-4 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Saat aktif, peserta wajib mengumpulkan tugas sebelum sertifikat bisa diterbitkan. Pengumpulan terbuka
                setelah semua pelajaran ditandai selesai. Format file: PDF, JPG, PNG, atau WebP (maks. 15 MB).
              </p>
              <Button variant="ghost" size="sm" onClick={remove} className="gap-2 text-destructive shrink-0">
                <Trash2 size={13} /> Hapus Tugas
              </Button>
            </div>
          </div>

          <h2 className="text-xl mb-4">Tugas Terkumpul ({submissions.length})</h2>
          {submissions.length === 0 ? (
            <div className="border border-dashed border-border/50 p-10 text-center text-muted-foreground text-sm">
              Belum ada peserta yang mengumpulkan tugas.
            </div>
          ) : (
            <div className="border border-border/50 divide-y divide-border/50">
              {submissions.map((s) => (
                <div key={s.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.user.profile?.full_name || s.user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {s.user.email}
                      {s.user.profile?.phone ? ` · ${s.user.profile.phone}` : ""}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {s.file_name} · {formatSize(s.file_size)} · {formatDateTime(s.updated_at)}
                    </p>
                    {s.note && <p className="text-xs mt-1.5 whitespace-pre-line">Catatan: {s.note}</p>}
                  </div>
                  <Button asChild variant="outline" size="sm" className="rounded-none gap-2 shrink-0">
                    <a href={`/api/assignments/submissions/${s.id}/file`} target="_blank" rel="noreferrer">
                      <ExternalLink size={13} /> Buka File
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCourseAssignment;
