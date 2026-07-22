import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Award, Download, Copy, CheckCircle2, ShieldX, ExternalLink, GraduationCap, ClipboardCheck } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { api, ApiError, type Certificate, type OrderCourse } from "@/lib/api";

type EligibleCourse = { course: OrderCourse; completed: number; total: number; quiz_score: number | null };
type QuizPendingCourse = {
  course: OrderCourse;
  completed: number;
  total: number;
  quiz: { id: string; passing_score: number; best_score: number | null; attempts_count: number };
};
type CertificatesResponse = {
  certificates: Certificate[];
  eligible: EligibleCourse[];
  quiz_pending: QuizPendingCourse[];
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

const Certificates = () => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [eligible, setEligible] = useState<EligibleCourse[]>([]);
  const [quizPending, setQuizPending] = useState<QuizPendingCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [issuing, setIssuing] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.get<CertificatesResponse>("/certificates");
      setCertificates(data.certificates);
      setEligible(data.eligible);
      setQuizPending(data.quiz_pending ?? []);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal memuat sertifikat");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleIssue = async (courseId: string) => {
    setIssuing(courseId);
    try {
      await api.post<Certificate>("/certificates/issue", { course_id: courseId });
      toast.success("Sertifikat berhasil diterbitkan");
      await load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Gagal menerbitkan sertifikat");
    } finally {
      setIssuing(null);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloading(cert.id);
    try {
      const res = await fetch(`/api/certificates/${cert.id}/download`, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal mengunduh sertifikat");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sertifikat-${cert.certificate_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengunduh sertifikat");
    } finally {
      setDownloading(null);
    }
  };

  const handleCopyLink = async (cert: Certificate) => {
    const link = `${window.location.origin}/verifikasi/${cert.certificate_number}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Tautan verifikasi disalin");
    } catch {
      toast.error("Gagal menyalin tautan");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-32">
        <div className="container mx-auto px-6 md:px-16 max-w-5xl">
          {/* Header */}
          <div className="mb-4">
            <h1 className="text-3xl md:text-5xl font-light text-foreground tracking-normal">Sertifikat Saya</h1>
            <p
              className="text-sm text-muted-foreground mt-3 max-w-lg"
              style={{ letterSpacing: "normal", textTransform: "none" }}
            >
              Bukti penyelesaian kelas yang dapat kamu unduh dan verifikasi keasliannya secara publik.
            </p>
          </div>

          <div className="border-t border-border pt-3 mb-12">
            <span className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground">
              {certificates.length} Sertifikat Diterbitkan
            </span>
          </div>

          {loading ? (
            <p className="text-muted-foreground text-sm" style={{ letterSpacing: "normal", textTransform: "none" }}>
              Memuat sertifikat...
            </p>
          ) : (
            <>
              {/* Eligible (completed but not yet issued) */}
              {eligible.length > 0 && (
                <section className="mb-16">
                  <h2 className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-4">
                    Siap Diterbitkan
                  </h2>
                  <div className="space-y-3">
                    {eligible.map((e) => (
                      <div
                        key={e.course.id}
                        className="flex items-center justify-between gap-4 border border-border p-5"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 flex items-center justify-center border border-border shrink-0">
                            <GraduationCap size={18} className="text-accent" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[12px] tracking-editorial uppercase text-foreground truncate">
                              {e.course.title}
                            </h3>
                            <p
                              className="text-[11px] text-muted-foreground"
                              style={{ letterSpacing: "normal", textTransform: "none" }}
                            >
                              Kelas selesai 100% ({e.completed}/{e.total} pelajaran)
                              {e.quiz_score !== null && ` · Final Quiz lulus, nilai ${e.quiz_score}`}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleIssue(e.course.id)}
                          disabled={issuing === e.course.id}
                          className="rounded-none gap-2 shrink-0"
                        >
                          <Award size={14} />
                          {issuing === e.course.id ? "Menerbitkan..." : "Terbitkan"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Materi selesai tapi Final Quiz belum lulus */}
              {quizPending.length > 0 && (
                <section className="mb-16">
                  <h2 className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-4">
                    Menunggu Final Quiz
                  </h2>
                  <div className="space-y-3">
                    {quizPending.map((p) => (
                      <div
                        key={p.course.id}
                        className="flex items-center justify-between gap-4 border border-border p-5"
                      >
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-10 h-10 flex items-center justify-center border border-border shrink-0">
                            <ClipboardCheck size={18} className="text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-[12px] tracking-editorial uppercase text-foreground truncate">
                              {p.course.title}
                            </h3>
                            <p
                              className="text-[11px] text-muted-foreground"
                              style={{ letterSpacing: "normal", textTransform: "none" }}
                            >
                              Materi selesai — lulus Final Quiz (nilai ≥ {p.quiz.passing_score}) untuk membuka
                              sertifikat
                              {p.quiz.best_score !== null && `. Nilai terbaikmu ${p.quiz.best_score}`}
                            </p>
                          </div>
                        </div>
                        <Button asChild variant="outline" className="rounded-none gap-2 shrink-0">
                          <Link to={`/belajar/${p.course.slug}/quiz`}>
                            <ClipboardCheck size={14} />
                            {p.quiz.attempts_count > 0 ? "Ulangi Kuis" : "Kerjakan Kuis"}
                          </Link>
                        </Button>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Issued certificates */}
              {certificates.length === 0 ? (
                <div className="border border-border p-12 text-center">
                  <Award size={28} className="mx-auto text-muted-foreground mb-3" />
                  <p
                    className="text-muted-foreground mb-4 text-sm"
                    style={{ letterSpacing: "normal", textTransform: "none" }}
                  >
                    Kamu belum memiliki sertifikat. Selesaikan kelas untuk mendapatkannya.
                  </p>
                  <Button asChild className="rounded-none">
                    <Link to="/kelas">Lihat Katalog Kelas</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="border border-border p-6 flex flex-col">
                      <div className="flex items-start justify-between mb-4">
                        <Award size={22} className="text-accent" />
                        {cert.revoked ? (
                          <span className="flex items-center gap-1 text-[10px] tracking-editorial uppercase text-red-600">
                            <ShieldX size={12} /> Dicabut
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] tracking-editorial uppercase text-emerald-600">
                            <CheckCircle2 size={12} /> Valid
                          </span>
                        )}
                      </div>

                      <h3 className="text-[13px] tracking-editorial uppercase text-foreground mb-1 leading-tight">
                        {cert.course_title}
                      </h3>
                      <p
                        className="text-[11px] text-muted-foreground mb-1"
                        style={{ letterSpacing: "normal", textTransform: "none" }}
                      >
                        a.n. {cert.recipient_name}
                      </p>
                      {cert.instructor_name && (
                        <p
                          className="text-[11px] text-muted-foreground"
                          style={{ letterSpacing: "normal", textTransform: "none" }}
                        >
                          Instruktur: {cert.instructor_name}
                        </p>
                      )}
                      {typeof cert.quiz_score === "number" && (
                        <p
                          className="text-[11px] text-muted-foreground"
                          style={{ letterSpacing: "normal", textTransform: "none" }}
                        >
                          Nilai Final Quiz: {cert.quiz_score}/100
                        </p>
                      )}
                      <p
                        className="text-[11px] text-muted-foreground mt-3"
                        style={{ letterSpacing: "normal", textTransform: "none" }}
                      >
                        Diterbitkan {formatDate(cert.issued_at)}
                      </p>
                      <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mt-1">
                        {cert.certificate_number}
                      </p>

                      {cert.revoked && cert.revoked_reason && (
                        <p
                          className="text-[11px] text-red-600 mt-3"
                          style={{ letterSpacing: "normal", textTransform: "none" }}
                        >
                          Alasan dicabut: {cert.revoked_reason}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-2 mt-5 pt-5 border-t border-border">
                        <Button
                          size="sm"
                          onClick={() => handleDownload(cert)}
                          disabled={downloading === cert.id}
                          className="rounded-none gap-2"
                        >
                          <Download size={13} />
                          {downloading === cert.id ? "Mengunduh..." : "Unduh PDF"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleCopyLink(cert)}
                          className="rounded-none gap-2"
                        >
                          <Copy size={13} /> Salin Tautan
                        </Button>
                        <Button size="sm" variant="ghost" asChild className="rounded-none gap-2">
                          <Link to={`/verifikasi/${cert.certificate_number}`}>
                            <ExternalLink size={13} /> Verifikasi
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
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

export default Certificates;
