import { Progress } from "@/components/ui/progress";

type Props = {
  completed: number;
  total: number;
  pct: number;
  className?: string;
};

const CourseProgressBar = ({ completed, total, pct, className }: Props) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">Progres</span>
        <span className="text-[10px] tracking-editorial uppercase text-foreground">
          {completed}/{total} · {pct}%
        </span>
      </div>
      <Progress value={pct} className="h-1.5" />
    </div>
  );
};

export default CourseProgressBar;
