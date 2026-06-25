import { CheckCircle2, Circle, Lock, PlayCircle } from "lucide-react";
import type { PlayerModule, PlayerLesson } from "@/lib/api";
import { formatDuration } from "@/lib/format";

type Props = {
  modules: PlayerModule[];
  activeLessonId: string | null;
  onSelect: (lesson: PlayerLesson) => void;
};

const LessonList = ({ modules, activeLessonId, onSelect }: Props) => {
  return (
    <div className="space-y-6">
      {modules.map((mod, mi) => (
        <div key={mod.id}>
          <p className="text-[10px] tracking-editorial uppercase text-muted-foreground px-3 mb-2">
            Modul {mi + 1} · {mod.title}
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
                        <CheckCircle2 size={15} className="text-emerald-600" />
                      ) : active ? (
                        <PlayCircle size={15} className="text-accent" />
                      ) : (
                        <Circle size={15} className="text-muted-foreground/60" />
                      )}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm leading-snug truncate">{lesson.title}</span>
                      <span className="flex items-center gap-2 mt-0.5">
                        {lesson.duration_minutes ? (
                          <span className="text-[10px] text-muted-foreground">{formatDuration(lesson.duration_minutes)}</span>
                        ) : null}
                        {lesson.is_free_preview && lesson.locked && (
                          <span className="text-[9px] tracking-editorial uppercase text-accent">Preview</span>
                        )}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default LessonList;
