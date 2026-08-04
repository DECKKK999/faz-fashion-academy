import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import type { PlayerModule, PlayerLesson } from "@/lib/api";
import { formatDuration } from "@/lib/format";

type Props = {
  modules: PlayerModule[];
  activeLessonId: string | null;
  onSelect: (lesson: PlayerLesson) => void;
};

// Judul lesson mengikuti format "Bab X.Y – <Nama Modul> (<Judul Video>)" —
// sidebar hanya menampilkan judul video (isi kurung), nama modul dipakai untuk header grup.
const moduleNameFromLessonTitle = (title: string): string | null => {
  const match = title.match(/^Bab\s+\d+\.\d+\s*[–-]\s*(.+?)\s*\(/i);
  return match ? match[1].trim() : null;
};

const lessonDisplayTitle = (title: string, isIntro: boolean): string => {
  if (isIntro) {
    const match = title.match(/^Introduction\s*[-–]\s*(.+)$/i);
    return match ? match[1].trim() : title;
  }
  // Judul video bisa memuat tanda kurung sendiri (mis. "... (BEP)"), jadi ambil
  // dari kurung buka pertama sampai kurung tutup terakhir, bukan pasangan kurung terluar via regex.
  const start = title.indexOf("(");
  const end = title.lastIndexOf(")");
  if (start !== -1 && end !== -1 && end > start) {
    return title.slice(start + 1, end).trim();
  }
  return title;
};

const LessonList = ({ modules, activeLessonId, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      {modules.map((mod) => {
        const isIntro = mod.title.trim().toLowerCase() === "pendahuluan";
        const moduleName = !isIntro && mod.lessons.length > 0 ? moduleNameFromLessonTitle(mod.lessons[0].title) : null;
        const label = isIntro ? "Introduction" : moduleName ? `${mod.title} - ${moduleName}` : mod.title;
        return (
        <div key={mod.id}>
          <p className="text-[11px] tracking-editorial uppercase text-muted-foreground px-3 mb-2">
            {label}
          </p>
          <ul className="space-y-0.5">
            {mod.lessons.map((lesson) => {
              const active = lesson.id === activeLessonId;
              return (
                <li key={lesson.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(lesson)}
                    aria-current={active ? "true" : undefined}
                    className={`w-full flex items-start gap-3 text-left px-3 py-2.5 rounded-md transition-colors ${
                      active
                        ? "bg-foreground/10 text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">
                      {lesson.locked ? (
                        <Lock size={15} className="text-muted-foreground" />
                      ) : lesson.completed ? (
                        <CheckCircle2 size={15} className="text-emerald-500" />
                      ) : active ? (
                        <PlayCircle size={15} className="text-accent" />
                      ) : (
                        <Circle size={15} className="text-muted-foreground/60" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm leading-snug truncate">{lessonDisplayTitle(lesson.title, isIntro)}</span>
                      <span className="flex items-center gap-2 mt-0.5">
                        {lesson.duration_minutes ? (
                          <span className="text-[11px] text-muted-foreground">{formatDuration(lesson.duration_minutes)}</span>
                        ) : null}
                        {lesson.is_free_preview && lesson.locked && (
                          <span className="text-[10px] tracking-editorial uppercase text-accent">Preview</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        );
      })}
    </div>
  );
};

export default LessonList;
