import { useState } from "react";
import { Star } from "lucide-react";

type Props = {
  value: number;
  onChange?: (value: number) => void;
  readOnly?: boolean;
  size?: number;
  className?: string;
};

const StarRatingInput = ({ value, onChange, readOnly = false, size = 24, className = "" }: Props) => {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? value;

  return (
    <div className={`flex items-center gap-1 ${className}`} role={readOnly ? undefined : "radiogroup"} aria-label="Beri rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= active;
        return (
          <button
            key={star}
            type="button"
            disabled={readOnly}
            aria-label={`${star} bintang`}
            aria-checked={star === value}
            role={readOnly ? undefined : "radio"}
            onClick={() => !readOnly && onChange?.(star)}
            onMouseEnter={() => !readOnly && setHover(star)}
            onMouseLeave={() => !readOnly && setHover(null)}
            className={`transition-transform ${readOnly ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
          >
            <Star
              size={size}
              className={filled ? "text-gold fill-gold" : "text-muted-foreground/40"}
            />
          </button>
        );
      })}
    </div>
  );
};

export default StarRatingInput;
