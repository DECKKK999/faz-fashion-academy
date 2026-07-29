import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
      title={theme === "dark" ? "Mode terang" : "Mode gelap"}
      className={`w-8 h-8 rounded-full border border-border/60 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors shrink-0 ${className}`}
    >
      {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
    </button>
  );
};

export default ThemeToggle;
