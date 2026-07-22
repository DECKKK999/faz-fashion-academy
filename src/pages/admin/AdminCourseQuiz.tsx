import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { api, type AdminQuiz, type AdminQuizAttempt, type AdminQuizQuestion } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type Course = { id: string; title: string; slug: string };

const letter = (i: number) => String.fromCharCode(65 + i);

const AdminCourseQuiz = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [quiz, setQuiz] = useState<AdminQuiz | null>(null);
  const [attempts, setAttempts] = useState<AdminQuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingMeta, setSavingMeta] = useState(false);

  const fail = (e: unknown, fallback: string) =>
    toast({ title: "Error", description: e instanceof Error ? e.message : fallback, variant: "destructive" });

  const load = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const c = await api.get<Course>(`/courses/${id}`);
      setCourse(c);
      const q = await api.get<AdminQuiz | null>(`/admin/quizzes/by-course/${id}`);
      setQuiz(q);
      if (q) setAttempts(await api.get<AdminQuizAttempt[]>(`/admin/quizzes/${q.id}/attempts`));
    } catch (e) {
      fail(e, "Gagal memuat kuis");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const createQuiz = async () => {
    if (!id) return;
    try {
      const q = await api.post<AdminQuiz>(`/admin/quizzes/by-course/${id}`, {});
      setQuiz(q);
      toast({ title: "Kuis dibuat" });
    } catch (e) {
      fail(e, "Gagal membuat kuis");
    }
  };

  const saveMeta = async () => {
    if (!quiz) return;
    setSavingMeta(true);
    try {
      const updated = await api.patch<AdminQuiz>(`/admin/quizzes/${quiz.id}`, {
        title: quiz.title,
        description: quiz.description,
        passing_score: quiz.passing_score,
        is_published: quiz.is_published,
      });
      setQuiz(updated);
      toast({ title: "Pengaturan kuis disimpan" });
    } catch (e) {
      fail(e, "Gagal menyimpan kuis");
    } finally {
      setSavingMeta(false);
    }
  };

  const deleteQuiz = async () => {
    if (!quiz) return;
    if (!confirm("Hapus kuis ini beserta seluruh soal dan riwayat percobaan peserta?")) return;
    try {
      await api.delete(`/admin/quizzes/${quiz.id}`);
      setQuiz(null);
      setAttempts([]);
      toast({ title: "Kuis dihapus" });
    } catch (e) {
      fail(e, "Gagal menghapus kuis");
    }
  };

  const addQuestion = async () => {
    if (!quiz) return;
    try {
      const q = await api.post<AdminQuizQuestion>(`/admin/quizzes/${quiz.id}/questions`, {});
      setQuiz({ ...quiz, questions: [...quiz.questions, q] });
    } catch (e) {
      fail(e, "Gagal menambah soal");
    }
  };

  const patchQuestion = (updated: AdminQuizQuestion) =>
    setQuiz((prev) =>
      prev ? { ...prev, questions: prev.questions.map((q) => (q.id === updated.id ? updated : q)) } : prev
    );

  const saveQuestion = async (q: AdminQuizQuestion) => {
    try {
      const saved = await api.patch<AdminQuizQuestion>(`/admin/quizzes/questions/${q.id}`, {
        prompt: q.prompt,
        explanation: q.explanation,
        options: q.options.map((o) => ({ text: o.text, is_correct: o.is_correct })),
      });
      patchQuestion(saved);
      toast({ title: "Soal disimpan" });
    } catch (e) {
      fail(e, "Gagal menyimpan soal");
    }
  };

  const deleteQuestion = async (questionId: string) => {
    if (!quiz) return;
    if (!confirm("Hapus soal ini?")) return;
    try {
      await api.delete(`/admin/quizzes/questions/${questionId}`);
      setQuiz({ ...quiz, questions: quiz.questions.filter((q) => q.id !== questionId) });
    } catch (e) {
      fail(e, "Gagal menghapus soal");
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
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Final Quiz</p>
          <h1 className="text-3xl">{course?.title ?? "Kelas"}</h1>
        </div>
        {quiz && (
          <Button onClick={saveMeta} disabled={savingMeta} className="rounded-none">
            {savingMeta ? "Saving..." : "Save Quiz"}
          </Button>
        )}
      </div>

      {!quiz ? (
        <div className="border border-dashed border-border/50 p-10 text-center">
          <p className="text-muted-foreground text-sm mb-5">
            Kelas ini belum punya Final Quiz. Tanpa kuis, sertifikat terbit begitu semua pelajaran selesai.
          </p>
          <Button onClick={createQuiz} className="rounded-none gap-2">
            <Plus size={14} /> Buat Final Quiz
          </Button>
        </div>
      ) : (
        <>
          {/* Pengaturan kuis */}
          <div className="border border-border/50 p-6 mb-10 grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <Label className="text-[10px] tracking-editorial uppercase">Judul</Label>
              <Input
                value={quiz.title}
                onChange={(e) => setQuiz({ ...quiz, title: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div className="col-span-2">
              <Label className="text-[10px] tracking-editorial uppercase">Deskripsi</Label>
              <Textarea
                rows={3}
                value={quiz.description ?? ""}
                onChange={(e) => setQuiz({ ...quiz, description: e.target.value || null })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="text-[10px] tracking-editorial uppercase">Nilai lulus (0-100)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={quiz.passing_score}
                onChange={(e) =>
                  setQuiz({ ...quiz, passing_score: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })
                }
                className="mt-1.5"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">
                {quiz.questions.length > 0
                  ? `≈ ${Math.ceil((quiz.passing_score / 100) * quiz.questions.length)} dari ${quiz.questions.length} soal harus benar`
                  : "Tambahkan soal terlebih dahulu"}
              </p>
            </div>
            <div className="flex items-end gap-3 pb-2">
              <Switch
                checked={quiz.is_published}
                onCheckedChange={(v) => setQuiz({ ...quiz, is_published: v })}
              />
              <Label className="text-[11px] tracking-editorial uppercase">Aktif</Label>
            </div>
            <div className="col-span-2 border-t border-border/50 pt-4 flex items-center justify-between">
              <p className="text-[11px] text-muted-foreground">
                Saat aktif dan punya minimal 1 soal, peserta wajib lulus kuis ini sebelum sertifikat bisa
                diterbitkan. Kuis terbuka setelah semua pelajaran ditandai selesai.
              </p>
              <Button variant="ghost" size="sm" onClick={deleteQuiz} className="gap-2 text-destructive shrink-0">
                <Trash2 size={13} /> Hapus Kuis
              </Button>
            </div>
          </div>

          {/* Soal */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl">Soal ({quiz.questions.length})</h2>
            <Button onClick={addQuestion} variant="outline" size="sm" className="rounded-none gap-2">
              <Plus size={14} /> Add Question
            </Button>
          </div>

          {quiz.questions.length === 0 && (
            <div className="border border-dashed border-border/50 p-10 text-center text-muted-foreground text-sm">
              Belum ada soal. Tambah manual, atau jalankan <code>npm run seed:quiz</code> di folder server untuk
              mengisi 10 soal dari dokumen Final Quiz.
            </div>
          )}

          <div className="space-y-4">
            {quiz.questions.map((q, qi) => (
              <QuestionCard
                key={q.id}
                index={qi}
                question={q}
                onChange={patchQuestion}
                onSave={() => saveQuestion(q)}
                onDelete={() => deleteQuestion(q.id)}
              />
            ))}
          </div>

          {/* Rekap percobaan peserta */}
          {attempts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl mb-4">Percobaan Peserta ({attempts.length})</h2>
              <div className="border border-border/50 divide-y divide-border/50">
                {attempts.map((a) => (
                  <div key={a.id} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                    <span className="min-w-0 truncate">
                      {a.user.profile?.full_name || a.user.email}
                      <span className="text-muted-foreground"> · {new Date(a.submitted_at).toLocaleString("id-ID")}</span>
                    </span>
                    <span className="flex items-center gap-3 shrink-0">
                      <span>
                        {a.score} · {a.correct_count}/{a.total_questions}
                      </span>
                      <span
                        className={`text-[10px] tracking-editorial uppercase ${
                          a.passed ? "text-emerald-600" : "text-muted-foreground"
                        }`}
                      >
                        {a.passed ? "Lulus" : "Belum"}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

type QuestionCardProps = {
  index: number;
  question: AdminQuizQuestion;
  onChange: (q: AdminQuizQuestion) => void;
  onSave: () => void;
  onDelete: () => void;
};

const QuestionCard = ({ index, question, onChange, onSave, onDelete }: QuestionCardProps) => {
  const setOption = (optionId: string, patch: Partial<AdminQuizQuestion["options"][number]>) =>
    onChange({
      ...question,
      options: question.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    });

  // Tepat satu jawaban benar — memilih opsi lain otomatis membatalkan pilihan sebelumnya.
  const setCorrect = (optionId: string) =>
    onChange({
      ...question,
      options: question.options.map((o) => ({ ...o, is_correct: o.id === optionId })),
    });

  const addOption = () =>
    onChange({
      ...question,
      options: [
        ...question.options,
        { id: `new-${Date.now()}`, text: "", is_correct: false, position: question.options.length },
      ],
    });

  const removeOption = (optionId: string) => {
    if (question.options.length <= 2) {
      toast({ title: "Minimal 2 pilihan", variant: "destructive" });
      return;
    }
    onChange({ ...question, options: question.options.filter((o) => o.id !== optionId) });
  };

  const hasCorrect = question.options.some((o) => o.is_correct);

  return (
    <div className="border border-border/50 p-5 space-y-3">
      <div className="flex items-start gap-3">
        <span className="text-[10px] tracking-editorial uppercase text-muted-foreground mt-3 shrink-0">
          Q{index + 1}
        </span>
        <Textarea
          rows={2}
          value={question.prompt}
          onChange={(e) => onChange({ ...question, prompt: e.target.value })}
          className="flex-1 text-sm"
          placeholder="Pertanyaan"
        />
        <Button size="sm" variant="ghost" onClick={onDelete} className="shrink-0">
          <Trash2 size={14} />
        </Button>
      </div>

      <div className="space-y-2 pl-8">
        {question.options.map((o, oi) => (
          <div key={o.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCorrect(o.id)}
              title="Tandai sebagai jawaban benar"
              className={`w-7 h-7 flex items-center justify-center border shrink-0 ${
                o.is_correct ? "border-emerald-600 text-emerald-600" : "border-border text-muted-foreground"
              }`}
            >
              {o.is_correct ? <CheckCircle2 size={14} /> : <span className="text-[11px]">{letter(oi)}</span>}
            </button>
            <Input
              value={o.text}
              onChange={(e) => setOption(o.id, { text: e.target.value })}
              placeholder={`Pilihan ${letter(oi)}`}
              className="h-8 text-sm"
            />
            <Button size="sm" variant="ghost" onClick={() => removeOption(o.id)} className="shrink-0">
              <Trash2 size={12} />
            </Button>
          </div>
        ))}
        <Button onClick={addOption} variant="ghost" size="sm" className="gap-2">
          <Plus size={13} /> Add Option
        </Button>
      </div>

      <div className="pl-8">
        <Input
          value={question.explanation ?? ""}
          onChange={(e) => onChange({ ...question, explanation: e.target.value || null })}
          placeholder="Pembahasan / catatan internal (tidak ditampilkan ke peserta)"
          className="h-8 text-xs"
        />
      </div>

      <div className="flex items-center justify-between pl-8 pt-1">
        <span className={`text-[11px] ${hasCorrect ? "text-muted-foreground" : "text-destructive"}`}>
          {hasCorrect ? "Klik huruf di kiri untuk mengubah jawaban benar." : "Belum ada jawaban benar dipilih."}
        </span>
        <Button size="sm" variant="outline" onClick={onSave} className="rounded-none" disabled={!hasCorrect}>
          Simpan Soal
        </Button>
      </div>
    </div>
  );
};

export default AdminCourseQuiz;
