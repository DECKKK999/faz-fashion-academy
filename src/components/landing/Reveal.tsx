import { ReactNode } from "react";
import { useInView } from "@/hooks/useInView";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Scroll-triggered fade-up wrapper for the landing/about pages. Kept as a
 * plain IntersectionObserver hook rather than a new animation dependency —
 * the rest of the app already ships without framer-motion etc.
 */
const Reveal = ({ children, className, delayMs = 0 }: RevealProps) => {
  const { ref, inView } = useInView<HTMLDivElement>();

  return (
    <div
      ref={ref}
      className={cn("reveal-base", inView && "reveal-visible", className)}
      style={{ transitionDelay: inView ? `${delayMs}ms` : "0ms" }}
    >
      {children}
    </div>
  );
};

export default Reveal;
