import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroImg from "@/assets/hero-editorial.jpg";
import fazLogo from "@/assets/faz-logo.png";

const HeroSection = () => {
  const { user } = useAuth();
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


      {/* Center headline */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6">
        <img src={fazLogo} alt="FAZ Academy" className="w-64 md:w-96 lg:w-[28rem] xl:w-[32rem] animate-fade-in" />
        <p className="text-xs md:text-sm tracking-wide-editorial uppercase text-foreground/60 mt-6 animate-fade-in" style={{ animationDelay: "0.15s" }}>
          Fashion A-Z Academy
        </p>
        <div className="mt-10 animate-fade-in flex justify-center w-full" style={{ animationDelay: "0.25s" }}>
          <Button size="lg" className="rounded-none px-10 text-xs tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20 backdrop-blur-sm" asChild>
            <Link to={user ? "/kelas" : "/daftar"}>{user ? "CARI KELAS" : "Mulai Belajar"}</Link>
          </Button>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between px-6 sm:px-8 md:px-16 pb-8 sm:pb-10 md:pb-14 animate-fade-in" style={{ animationDelay: "0.35s" }}>
        <div>
          <p className="text-[10px] tracking-wide-editorial uppercase text-foreground/50 mb-1">Collaboration Between</p>
        </div>
        <div className="flex gap-6 sm:gap-12">
          <span className="text-[10px] tracking-wide-editorial uppercase text-foreground/50">AI Indonesia</span>
          <span className="text-[10px] tracking-wide-editorial uppercase text-foreground/50">Lenny Agustin</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
