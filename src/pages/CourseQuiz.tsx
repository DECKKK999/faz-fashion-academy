import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Award, CheckCircle2, Loader2, Lock, RotateCcw, XCircle } from "lucide-react";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { api, ApiError, type QuizState, type QuizSubmitResult } from "@/lib/api";

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

const CourseQuiz = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<QuizState | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await api.get<QuizState>(`/quizzes/by-course-slug/${slug}`);
      setData(res);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else toast.error(e instanceof Error ? e.message : "Gagal memuat kuis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const answeredCount = Object.keys(answers).length;
  const totalQuestions = data?.questions.length ?? 0;
  const allAnswered = totalQuestions > 0 && answeredCount === totalQuestions;

  // Peta soal → benar/salah dari hasil percobaan terakhir (kunci jawaban tidak dikirim server).
  const resultByQuestion = useMemo(() => {
    const map = new Map<string, boolean>();
    result?.results.forEach((r) => map.set(r.question_id, r.is_correct));
    return map;
  }, [result]);

  const submit = async () => {
    if (!data?.quiz || !allAnswered) return;
    setSubmitting(true);
    try {
      const res = await api.post<QuizSubmitResult>(`/quizzes/${data.quiz.id}/submit`, {
        answers: Object.entries(answers).map(([question_id, option_id]) => ({ question_id, option_id })),
      });
      setResult(res);
      window.scrollTo({ top: 0, behavior: "smooth" });
      if (res.passed) toast.success(`Selamat, kamu lulus dengan nilai ${res.score}!`);
      else toast.error(`Nilai ${res.score}. Minimal ${res.passing_score} untuk lulus — coba lagi.`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal mengirim jawaban");
    } finally {
      setSubmitting(false);
    }
  };

  const retry = () => {
    setResult(null);
    setAnswers({});
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  const { quiz, lessons, unlocked, best_attempt, attempts, passed } = data;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to={`/belajar/${data.course.slug}`}
            className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft size={13} /> Kembali ke Kelas
          </Link>

          <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-2">{data.course.title}</p>
          <h1 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-3">
            {quiz?.title ?? "Final Quiz"}
          </h1>

          {!quiz ? (
            <div className="border border-border rounded-lg p-8 text-center">
              <p className="text-muted-foreground text-sm">
                Kelas ini belum memiliki Final Quiz. Sertifikat dapat diterbitkan setelah semua pelajaran selesai.
              </p>
              <Button asChild variant="outline" size="sm" className="mt-5">
                <Link to="/sertifikat">Lihat Sertifikat</Link>
              </Button>
            </div>
          ) : (
            <>
              {quiz.description && (
                <p className="text-muted-foreground text-sm leading-relaxed mb-6">{quiz.description}</p>
              )}

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-[11px] tracking-editorial uppercase text-muted-foreground border-y border-border py-3 mb-8">
                <span>{quiz.total_questions} soal</span>
                <span>Nilai lulus ≥ {quiz.passing_score}</span>
                <span>Percobaan tidak dibatasi</span>
              </div>

              {/* Status kelulusan sebelumnya */}
              {passed && best_attempt && !result && (
                <div className="border border-accent/40 bg-accent/5 rounded-lg p-5 mb-8">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="text-accent mt-0.5 shrink-0" size={18} />
                    <div className="flex-1">
                      <p className="font-medium text-foreground mb-1">
                        Kamu sudah lulus dengan nilai {best_attempt.score}
                      </p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sertifikat kelas ini sudah bisa diterbitkan. Kamu tetap boleh mengulang kuis kalau mau
                        memperbaiki nilai.
                      </p>
                      <Button asChild size="sm" className="gap-2">
                        <Link to="/sertifikat">
                          <Award size={15} /> Terbitkan Sertifikat
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Hasil percobaan terakhir */}
              {result && <ResultPanel result={result} onRetry={retry} />}

              {/* Terkunci: pelajaran belum selesai */}
              {!unlocked ? (
                <div className="border border-border rounded-lg p-8 text-center">
                  <Lock className="mx-auto text-muted-foreground mb-3" size={26} />
                  <p className="font-medium text-foreground mb-1">Final Quiz masih terkunci</p>
                  <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                    {data.access.enrolled
                      ? "Selesaikan semua pelajaran kelas ini terlebih dahulu untuk membuka Final Quiz."
                      : "Daftar kelas ini terlebih dahulu untuk mengikuti Final Quiz."}
                  </p>
                  {data.access.enrolled && lessons.total > 0 && (
                    <div className="max-w-xs mx-auto mb-5">
                      <div className="flex items-center justify-between mb-2 text-[10px] tracking-editorial uppercase">
                        <span className="text-muted-foreground">Progres materi</span>
                        <span className="text-foreground">
                          {lessons.completed}/{lessons.total}
                        </span>
                      </div>
                      <Progress value={Math.round((lessons.completed / lessons.total) * 100)} className="h-1.5" />
                    </div>
                  )}
                  <Button asChild variant="outline" size="sm">
                    <Link to={`/belajar/${data.course.slug}`}>Lanjutkan Belajar</Link>
                  </Button>
                </div>
              ) : (
                <>
                  {/* Daftar soal */}
                  <div className="space-y-6">
                    {data.questions.map((q, i) => {
                      const verdict = resultByQuestion.get(q.id);
                      return (
                        <div
                          key={q.id}
                          className={`border rounded-lg p-5 ${
                            verdict === undefined
                              ? "border-border"
                              : verdict
                                ? "border-accent/40 bg-accent/5"
                                : "border-destructive/40 bg-destructive/5"
                          }`}
                        >
                          <div className="flex items-start gap-3 mb-4">
                            <span className="text-[10px] tracking-editorial uppercase text-muted-foreground mt-1 shrink-0">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <p className="font-medium text-foreground leading-relaxed flex-1">{q.prompt}</p>
                            {verdict !== undefined &&
                              (verdict ? (
                                <CheckCircle2 size={17} className="text-accent shrink-0 mt-0.5" />
                              ) : (
                                <XCircle size={17} className="text-destructive shrink-0 mt-0.5" />
                              ))}
                          </div>
                          <div className="space-y-2 pl-8">
                            {q.options.map((o, oi) => {
                              const selected = answers[q.id] === o.id;
                              return (
                                <label
                                  key={o.id}
                                  className={`flex items-start gap-3 rounded-md border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                                    selected
                                      ? "border-foreground/40 bg-foreground/[0.04]"
                                      : "border-border hover:bg-foreground/[0.02]"
                                  } ${result ? "pointer-events-none opacity-80" : ""}`}
                                >
                                  <input
                                    type="radio"
                                    name={q.id}
                                    value={o.id}
                                    checked={selected}
                                    disabled={!!result || submitting}
                                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: o.id }))}
                                    className="mt-1 accent-foreground"
                                  />
                                  <span className="text-muted-foreground">
                                    <span className="text-foreground mr-2">{String.fromCharCode(65 + oi)}.</span>
                                    {o.text}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Aksi kirim / ulang */}
                  <div className="sticky bottom-0 mt-8 -mx-4 px-4 py-4 bg-background/95 backdrop-blur border-t border-border flex flex-wrap items-center gap-3">
                    {result ? (
                      <>
                        <span className="text-sm text-muted-foreground">
                          Nilai {result.score} · {result.correct_count}/{result.total_questions} benar
                        </span>
                        <Button onClick={retry} variant="outline" size="sm" className="gap-2 ml-auto">
                          <RotateCcw size={15} /> Ulangi Kuis
                        </Button>
                        {result.passed && (
                          <Button asChild size="sm" className="gap-2">
                            <Link to="/sertifikat">
                              <Award size={15} /> Terbitkan Sertifikat
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-muted-foreground">
                          Terjawab {answeredCount}/{totalQuestions}
                        </span>
                        <Button
                          onClick={submit}
                          disabled={!allAnswered || submitting}
                          size="sm"
                          className="gap-2 ml-auto"
                        >
                          {submitting ? <Loader2 size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                          Kirim Jawaban
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Riwayat percobaan */}
                  {attempts.length > 0 && (
                    <div className="mt-10">
                      <h2 className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-3">
                        Riwayat Percobaan
                      </h2>
                      <div className="border border-border rounded-lg divide-y divide-border">
                        {attempts.map((a) => (
                          <div key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                            <span className="text-muted-foreground">{formatDateTime(a.submitted_at)}</span>
                            <span className="flex items-center gap-3">
                              <span className="text-foreground">
                                {a.score} · {a.correct_count}/{a.total_questions}
                              </span>
                              <span
                                className={`text-[10px] tracking-editorial uppercase ${
                                  a.passed ? "text-accent" : "text-muted-foreground"
                                }`}
                              >
                                {a.passed ? "Lulus" : "Belum lulus"}
                              </span>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Ringkasan hasil setelah submit — skor & soal mana yang salah, tanpa kunci jawaban.
const ResultPanel = ({ result, onRetry }: { result: QuizSubmitResult; onRetry: () => void }) => {
  const wrong = result.results.filter((r) => !r.is_correct);
  return (
    <div
      className={`border rounded-lg p-6 mb-8 ${
        result.passed ? "border-accent/40 bg-accent/5" : "border-destructive/40 bg-destructive/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {result.passed ? (
          <CheckCircle2 className="text-accent mt-0.5 shrink-0" size={20} />
        ) : (
          <XCircle className="text-destructive mt-0.5 shrink-0" size={20} />
        )}
        <div className="flex-1">
          <p className="font-serif text-2xl font-bold text-foreground mb-1">
            {result.score}
            <span className="text-base font-normal text-muted-foreground">/100</span>
          </p>
          <p className="text-sm text-muted-foreground mb-3">
            {result.correct_count} dari {result.total_questions} soal benar · nilai lulus ≥ {result.passing_score}
          </p>

          {result.passed ? (
            <p className="text-sm text-foreground">
              Selamat, kamu lulus Final Quiz! Sertifikat kelas ini sudah bisa diterbitkan.
            </p>
          ) : (
            <>
              <p className="text-sm text-foreground mb-2">
                Belum lulus. Pelajari kembali materinya, lalu ulangi kuis — percobaan tidak dibatasi.
              </p>
              {wrong.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Soal yang masih salah: {wrong.map((w) => `No. ${w.number}`).join(", ")}
                </p>
              )}
            </>
          )}

          <div className="flex flex-wrap gap-3 mt-4">
            <Button onClick={onRetry} variant="outline" size="sm" className="gap-2">
              <RotateCcw size={15} /> Ulangi Kuis
            </Button>
            {result.passed && (
              <Button asChild size="sm" className="gap-2">
                <Link to="/sertifikat">
                  <Award size={15} /> Terbitkan Sertifikat
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseQuiz;
