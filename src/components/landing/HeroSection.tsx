import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-fashion.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      <img
        src={heroImage}
        alt="FAZ Academy fashion studio"
        className="absolute inset-0 w-full h-full object-cover"
        width={1920}
        height={1080}
      />
      <div className="absolute inset-0 hero-overlay" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <p className="text-gold-light text-sm tracking-[0.3em] uppercase mb-4 font-sans animate-fade-in">
          Fashion A-Z Academy
        </p>
        <h1 className="font-serif text-4xl md:text-6xl lg:text-7xl font-bold text-primary-foreground mb-6 leading-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
          Kuasai Dunia Fashion<br />
          <span className="text-gold-gradient italic">dari A sampai Z</span>
        </h1>
        <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-sans animate-fade-in" style={{ animationDelay: "0.2s" }}>
          Platform pembelajaran online terlengkap untuk industri fashion Indonesia.
          Kelas, e-book, event, dan sertifikasi profesional.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Button variant="hero" size="lg" asChild>
            <Link to="/daftar">Mulai Belajar Gratis</Link>
          </Button>
          <Button variant="hero-outline" size="lg" asChild>
            <Link to="/kelas">Jelajahi Kelas</Link>
          </Button>
        </div>

        <div className="flex justify-center gap-12 mt-16 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {[
            { value: "5,000+", label: "Siswa Aktif" },
            { value: "120+", label: "Kelas Online" },
            { value: "50+", label: "Instruktur Ahli" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="font-serif text-2xl md:text-3xl font-bold text-primary-foreground">{stat.value}</p>
              <p className="text-primary-foreground/60 text-xs tracking-widest uppercase mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
