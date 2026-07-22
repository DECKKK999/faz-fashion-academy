import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronLeft, ChevronRight, CheckCircle2, Lock, RotateCcw, Loader2, ClipboardCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LessonList from "@/components/player/LessonList";
import CourseProgressBar from "@/components/player/CourseProgressBar";
import { api, ApiError, type PlayerCourse, type PlayerLesson, type PlayerQuizSummary, type LessonProgressResult } from "@/lib/api";
import { toast } from "sonner";

// Parse YouTube id dari youtu.be/ID, watch?v=ID, /embed/ID, /shorts/ID
function youtubeId(url: string): string | null {
  try {
    const u = new URL(url);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      return id || null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
      if (u.pathname === "/watch") return u.searchParams.get("v");
      const parts = u.pathname.split("/").filter(Boolean);
      if (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "v") return parts[1] || null;
    }
    return null;
  } catch {
    return null;
  }
}

type FlatLesson = PlayerLesson & { moduleTitle: string };

const CoursePlayer = () => {
  const { slug } = useParams<{ slug: string }>();
  const [data, setData] = useState<PlayerCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  const load = async () => {
    if (!slug) return;
    setLoading(true);
    setNotFound(false);
    try {
      const res = await api.get<PlayerCourse>(`/player/courses/by-slug/${slug}`);
      setData(res);
      setActiveId((prev) => prev ?? res.resume_lesson_id ?? firstLessonId(res));
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) setNotFound(true);
      else toast.error(e instanceof Error ? e.message : "Gagal memuat kelas");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Daftar lesson datar untuk navigasi prev/next dan lookup aktif
  const flat: FlatLesson[] = useMemo(
    () =>
      data
        ? data.modules.flatMap((m) => m.lessons.map((l) => ({ ...l, moduleTitle: m.title })))
        : [],
    [data]
  );

  const activeIndex = flat.findIndex((l) => l.id === activeId);
  const active = activeIndex >= 0 ? flat[activeIndex] : null;
  const prev = activeIndex > 0 ? flat[activeIndex - 1] : null;
  const next = activeIndex >= 0 && activeIndex < flat.length - 1 ? flat[activeIndex + 1] : null;

  const selectLesson = (lesson: PlayerLesson) => {
    setActiveId(lesson.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Terapkan hasil progress dari server ke state lokal (sinkronkan completed & ringkasan).
  const applyProgress = (r: LessonProgressResult) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        modules: prev.modules.map((m) => ({
          ...m,
          lessons: m.lessons.map((l) => (l.id === r.lesson_id ? { ...l, completed: r.completed } : l)),
        })),
        completed_count: r.completed_count,
        total_lessons: r.total_lessons,
        progress_pct: r.progress_pct,
      };
    });
  };

  const toggleComplete = async () => {
    if (!active || active.locked) return;
    setMarking(true);
    const endpoint = active.completed ? "incomplete" : "complete";
    try {
      const r = await api.post<LessonProgressResult>(`/player/lessons/${active.id}/${endpoint}`);
      applyProgress(r);
      if (r.completed) {
        toast.success(
          r.course_completed
            ? data?.quiz
              ? "Semua pelajaran selesai — Final Quiz sudah terbuka."
              : "Selamat! Kelas selesai."
            : "Pelajaran ditandai selesai"
        );
        if (next && !next.locked) selectLesson(next);
      } else {
        toast.success("Tanda selesai dibatalkan");
      }
      // Status kunci Final Quiz ikut berubah saat kelas selesai / dibatalkan.
      if (data?.quiz && data.quiz.unlocked !== r.course_completed) await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Gagal memperbarui progres");
    } finally {
      setMarking(false);
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

  const sidebar = (
    <div className="space-y-5">
      <CourseProgressBar completed={data.completed_count} total={data.total_lessons} pct={data.progress_pct} />
      <LessonList modules={data.modules} activeLessonId={activeId} onSelect={selectLesson} />
      {data.quiz && <QuizCard quiz={data.quiz} courseSlug={data.course.slug} />}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <Link
              to={`/kelas/${data.course.slug}`}
              className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft size={13} /> Detail Kelas
            </Link>
            {!data.access.enrolled && data.access.can_manage && (
              <span className="text-[10px] tracking-editorial uppercase text-accent">Mode Pengelola</span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main pane */}
            <div className="lg:col-span-2 order-1">
              <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-2">
                {data.course.title}
              </p>

              {active ? (
                <>
                  <LessonContent lesson={active} courseSlug={data.course.slug} />

                  <h1 className="font-serif text-2xl md:text-3xl font-bold text-foreground mt-6 mb-1">
                    {active.title}
                  </h1>
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-5">
                    {active.moduleTitle}
                  </p>

                  {!active.locked && active.content && (
                    <div className="prose prose-sm max-w-none mb-8">
                      <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{active.content}</p>
                    </div>
                  )}

                  {/* Nav + tandai selesai */}
                  <div className="flex flex-wrap items-center gap-3 border-t border-border pt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!prev}
                      onClick={() => prev && selectLesson(prev)}
                      className="gap-1"
                    >
                      <ChevronLeft size={15} /> Sebelumnya
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!next}
                      onClick={() => next && selectLesson(next)}
                      className="gap-1"
                    >
                      Berikutnya <ChevronRight size={15} />
                    </Button>

                    {!active.locked && (
                      <Button
                        size="sm"
                        variant={active.completed ? "secondary" : "default"}
                        onClick={toggleComplete}
                        disabled={marking}
                        className="gap-2 ml-auto"
                      >
                        {marking ? (
                          <Loader2 size={15} className="animate-spin" />
                        ) : active.completed ? (
                          <RotateCcw size={15} />
                        ) : (
                          <CheckCircle2 size={15} />
                        )}
                        {active.completed ? "Batalkan" : "Tandai Selesai"}
                      </Button>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground text-sm">Belum ada pelajaran pada kelas ini.</p>
              )}
            </div>

            {/* Sidebar */}
            <aside className="lg:col-span-1 order-2">
              <div className="lg:sticky lg:top-24 border border-border rounded-lg p-5 bg-card">{sidebar}</div>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

// Kartu Final Quiz di sidebar: terkunci sampai semua pelajaran selesai.
const QuizCard = ({ quiz, courseSlug }: { quiz: PlayerQuizSummary; courseSlug: string }) => {
  const locked = !quiz.unlocked;
  return (
    <div className={`border rounded-lg p-4 ${quiz.passed ? "border-accent/40 bg-accent/5" : "border-border"}`}>
      <div className="flex items-center gap-2 mb-2">
        {locked ? (
          <Lock size={14} className="text-muted-foreground" />
        ) : quiz.passed ? (
          <CheckCircle2 size={14} className="text-accent" />
        ) : (
          <ClipboardCheck size={14} className="text-foreground" />
        )}
        <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">Final Quiz</span>
      </div>
      <p className="text-sm font-medium text-foreground mb-1">{quiz.title}</p>
      <p className="text-xs text-muted-foreground mb-3">
        {quiz.passed
          ? `Lulus dengan nilai ${quiz.best_score}. Sertifikat siap diterbitkan.`
          : locked
            ? "Terbuka setelah semua pelajaran ditandai selesai."
            : `${quiz.total_questions} soal · nilai lulus ≥ ${quiz.passing_score}${
                quiz.best_score !== null ? ` · nilai terbaikmu ${quiz.best_score}` : ""
              }`}
      </p>
      <Button asChild size="sm" variant={quiz.passed ? "outline" : "default"} className="w-full" disabled={locked}>
        {locked ? (
          <span>Terkunci</span>
        ) : (
          <Link to={`/belajar/${courseSlug}/quiz`}>
            {quiz.passed ? "Lihat Hasil" : quiz.best_score !== null ? "Ulangi Kuis" : "Kerjakan Kuis"}
          </Link>
        )}
      </Button>
    </div>
  );
};

// Render area video/konten untuk lesson aktif, termasuk state terkunci.
const LessonContent = ({ lesson, courseSlug }: { lesson: FlatLesson; courseSlug: string }) => {
  if (lesson.locked) {
    return (
      <div className="aspect-video w-full rounded-lg border border-border bg-muted/40 flex flex-col items-center justify-center text-center px-6">
        <Lock className="text-muted-foreground mb-3" size={28} />
        <p className="font-medium text-foreground mb-1">Pelajaran terkunci</p>
        <p className="text-sm text-muted-foreground mb-5 max-w-sm">
          Daftar kelas ini untuk membuka semua materi dan menandai progres belajarmu.
        </p>
        <Button asChild>
          <Link to={`/kelas/${courseSlug}`}>Lihat & Daftar Kelas</Link>
        </Button>
      </div>
    );
  }

  const ytId = lesson.video_url ? youtubeId(lesson.video_url) : null;

  if (ytId) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <iframe
          className="w-full h-full"
          src={`https://www.youtube.com/embed/${ytId}`}
          title={lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
      </div>
    );
  }

  if (lesson.video_url) {
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
        <video controls src={lesson.video_url} className="w-full h-full" />
      </div>
    );
  }

  // Tidak ada video — area kosong tetap menjaga rasio dan menampilkan placeholder
  return (
    <div className="aspect-video w-full rounded-lg border border-border bg-muted/40 flex items-center justify-center">
      <p className="text-sm text-muted-foreground">Pelajaran ini berupa materi bacaan.</p>
    </div>
  );
};

function firstLessonId(p: PlayerCourse): string | null {
  for (const m of p.modules) {
    if (m.lessons.length > 0) return m.lessons[0].id;
  }
  return null;
}

export default CoursePlayer;
