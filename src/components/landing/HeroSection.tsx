import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-12">
      <div className="max-w-4xl mx-auto text-center">
        <p className="text-muted-foreground text-sm tracking-wide mb-6 animate-fade-in">
          Fashion A-Z Academy
        </p>
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-foreground leading-[1.05] tracking-tight mb-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Kuasai dunia fashion.
        </h1>
        <p className="text-muted-foreground text-lg md:text-xl max-w-xl mx-auto mb-10 animate-fade-in leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Platform pembelajaran online terlengkap untuk industri fashion Indonesia.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button size="lg" className="rounded-full px-8 text-sm" asChild>
            <Link to="/daftar">Mulai Belajar</Link>
          </Button>
          <Button variant="ghost" size="lg" className="rounded-full px-8 text-sm text-muted-foreground" asChild>
            <Link to="/kelas">Jelajahi Kelas →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
