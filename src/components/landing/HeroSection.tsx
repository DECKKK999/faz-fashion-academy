import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-editorial.jpg";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="FAZ Academy Editorial"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
        <div className="hero-overlay absolute inset-0" />
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-8 md:px-16 pt-20 md:pt-24">
        <span className="text-xs tracking-wide-editorial uppercase text-foreground/70">
          www.fazacademy.id
        </span>
        <span className="text-xs tracking-wide-editorial uppercase text-foreground/70">
          Fashion Academy
        </span>
      </div>

      {/* Center headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        <h1 className="animate-fade-in">
          <span className="block text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-light tracking-editorial uppercase text-foreground leading-none">
            F.A-Z
          </span>
          <span className="block font-display italic font-light text-6xl md:text-8xl lg:text-9xl xl:text-[10rem] text-foreground leading-[0.85] -mt-2 md:-mt-4">
            Academy
          </span>
        </h1>
        <p className="text-xs md:text-sm tracking-wide-editorial uppercase text-foreground/60 mt-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Fashion A-Z Academy
        </p>
        <div className="mt-10 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <Button size="lg" className="rounded-none px-10 text-xs tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20 backdrop-blur-sm" asChild>
            <Link to="/daftar">Mulai Belajar</Link>
          </Button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex items-end justify-between px-8 md:px-16 pb-10 md:pb-14 animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <div>
          <p className="text-[10px] tracking-wide-editorial uppercase text-foreground/50 mb-1">Collaboration Between</p>
        </div>
        <div className="flex gap-12">
          <span className="text-[10px] tracking-wide-editorial uppercase text-foreground/50">AI Indonesia</span>
          <span className="text-[10px] tracking-wide-editorial uppercase text-foreground/50">Lenny Agustin</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
