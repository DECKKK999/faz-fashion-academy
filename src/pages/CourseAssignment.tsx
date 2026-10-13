import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, CheckCircle2, ExternalLink, FileText, Loader2, Lock, UploadCloud } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type AssignmentState, type AssignmentSubmission } from "@/lib/api";

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const formatSize = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;

const CourseAssignment = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<AssignmentState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = async () => {
    if (!slug) return;
    try {
      const res = await api.get<AssignmentState>(`/assignments/by-course-slug/${slug}`);
      setData(res);
      setNote((prev) => prev || res.submission?.note || "");
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else toast.error(e instanceof Error ? e.message : "Gagal memuat tugas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const pickFile = (picked: File | null) => {
    if (!picked || !data) return;
    if (picked.size > data.max_file_mb * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${data.max_file_mb} MB`);
      if (fileInput.current) fileInput.current.value = "";
      return;
    }
    setFile(picked);
  };

  const submit = async () => {
    if (!data?.assignment || !file) return;
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("file", file);
      if (note.trim()) form.append("note", note.trim());
      await api.upload<AssignmentSubmission>(`/assignments/${data.assignment.id}/submit`, form);
      toast.success("Tugas berhasil dikumpulkan");
      setFile(null);
      if (fileInput.current) fileInput.current.value = "";
      window.scrollTo({ top: 0, behavior: "smooth" });
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengumpulkan tugas");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm">Memuat...</div>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">Kelas tidak ditemukan.</p>
          <Button asChild variant="outline">
            <Link to="/kelas">Kembali ke katalog</Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const { assignment, lessons, unlocked, submission, access } = data;

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to={`/belajar/${data.course.slug}`}
            className="inline-flex items-center gap-2 text-[12px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={13} /> Kembali ke Kelas
          </Link>

          <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-2">{data.course.title}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-6">
            {assignment?.title ?? "Tugas Akhir"}
          </h1>

          {!assignment ? (
            <div className="border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground text-sm">
                {access.enrolled || access.can_manage
                  ? "Kelas ini tidak memiliki Tugas Akhir. Sertifikat dapat diterbitkan setelah semua pelajaran selesai."
                  : "Daftar kelas ini untuk melihat dan mengumpulkan Tugas Akhir."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link to={access.enrolled || access.can_manage ? "/sertifikat" : `/kelas/${data.course.slug}`}>
                  {access.enrolled || access.can_manage ? "Lihat Sertifikat" : "Lihat Kelas"}
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {assignment.description && (
                <div className="border border-border rounded-lg p-5 mb-8">
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-3">Instruksi</p>
                  <p
                    className="text-sm text-foreground/90 leading-relaxed whitespace-pre-line"
                    style={{ letterSpacing: "normal", textTransform: "none" }}
                  >
                    {assignment.description}
                  </p>
                </div>
              )}

              {/* Pengumpulan saat ini */}
              {submission && (
                <div className="border border-accent/40 bg-accent/5 rounded-lg p-5 mb-8">
                  <div className="flex items-center gap-2 mb-3 text-accent">
                    <CheckCircle2 size={16} />
                    <span className="text-[11px] tracking-editorial uppercase">Tugas sudah dikumpulkan</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="text-muted-foreground shrink-0 mt-0.5" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground truncate">{submission.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatSize(submission.file_size)} · dikumpulkan {formatDateTime(submission.updated_at)}
                      </p>
                      {submission.note && (
                        <p className="text-xs text-muted-foreground mt-2 whitespace-pre-line">Catatan: {submission.note}</p>
                      )}
                    </div>
                    <Button asChild variant="outline" size="sm" className="gap-1.5 shrink-0">
                      <a href={`/api/assignments/submissions/${submission.id}/file`} target="_blank" rel="noreferrer">
                        <ExternalLink size={13} /> Lihat
                      </a>
                    </Button>
                  </div>
                  <Button asChild size="sm" className="mt-5 rounded-full gap-2">
                    <Link to="/sertifikat">
                      <Award size={14} /> Lihat Sertifikat
                    </Link>
                  </Button>
                </div>
              )}

              {/* Form unggah */}
              {unlocked ? (
                <div className="border border-border rounded-lg p-5">
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-4">
                    {submission ? "Kirim Ulang (menimpa tugas sebelumnya)" : "Unggah Tugasmu"}
                  </p>

                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="w-full border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-foreground/40 transition-colors"
                  >
                    <UploadCloud size={26} className="mx-auto text-muted-foreground mb-3" />
                    {file ? (
                      <>
                        <p className="text-sm font-medium text-foreground break-all">{file.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">{formatSize(file.size)} · klik untuk mengganti</p>
                      </>
                    ) : (
                      <>
                        <p className="text-sm text-foreground">Klik untuk memilih file</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, JPG, PNG, atau WebP · maksimal {data.max_file_mb} MB. Gabungkan seluruh karyamu dalam satu file.
                        </p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInput}
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                  />

                  <div className="mt-5">
                    <Label htmlFor="note" className="text-xs">
                      Catatan untuk instruktur (opsional)
                    </Label>
                    <Textarea
                      id="note"
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      maxLength={1000}
                      rows={3}
                      placeholder="Mis. look yang kamu pilih dan tiga style adaptasinya"
                      className="mt-1.5"
                    />
                  </div>

                  <Button onClick={submit} disabled={!file || submitting} className="mt-5 w-full rounded-full gap-2" variant="gradient">
                    {submitting ? <Loader2 size={15} className="animate-spin" /> : <UploadCloud size={15} />}
                    {submitting ? "Mengunggah..." : submission ? "Kirim Ulang Tugas" : "Kumpulkan Tugas"}
                  </Button>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-8 text-center">
                  <Lock size={24} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-sm text-foreground mb-1">Pengumpulan belum terbuka</p>
                  <p className="text-xs text-muted-foreground">
                    {access.enrolled
                      ? `Selesaikan semua pelajaran terlebih dahulu (${lessons.completed}/${lessons.total} selesai).`
                      : access.can_manage
                        ? "Mode pengelola: hanya peserta terdaftar yang bisa mengumpulkan tugas."
                        : "Daftar kelas ini untuk mengumpulkan tugas."}
                  </p>
                  {access.enrolled && (
                    <Button asChild variant="outline" size="sm" className="mt-5">
                      <Link to={`/belajar/${data.course.slug}`}>Lanjut Belajar</Link>
                    </Button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default CourseAssignment;
