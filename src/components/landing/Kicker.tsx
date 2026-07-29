import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface KickerProps {
  index?: string;
  children: ReactNode;
  className?: string;
  tone?: "pink" | "olive";
}

/**
 * Small numbered section label ("01 — Masalah Yang Kami Lihat") in the
 * editorial mono face. Replaces the plain uppercase muted-foreground labels
 * that were scattered across the landing page and Tentang with one
 * consistent, slightly bolder signature element.
 */
const Kicker = ({ index, children, className, tone = "pink" }: KickerProps) => (
  <p
    className={cn(
      "font-mono-editorial font-bold text-[16px] tracking-[0.12em] uppercase flex items-center gap-2",
      tone === "pink" ? "text-primary" : "text-olive",
      className,
    )}
  >
    {index && <span className="text-muted-foreground">{index} —</span>}
    {children}
  </p>
);

export default Kicker;
