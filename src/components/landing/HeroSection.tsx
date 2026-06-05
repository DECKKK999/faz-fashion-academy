import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shirt, Lightbulb, Users, Star, Sparkles } from "lucide-react";
import heroFashion from "@/assets/hero-fashion.jpg";
import fazLogoAsset from "@/assets/faz-academy-logo.png.asset.json";

const pink = "hsl(330 81% 55%)";
const blue = "hsl(220 80% 55%)";

const features = [
  { icon: Shirt, label: "Fashion\nEducation" },
  { icon: Lightbulb, label: "Creative\nInnovation" },
  { icon: Users, label: "Community\nCollaboration" },
  { icon: Star, label: "Future\nLeaders" },
];

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-pink-50 via-white to-blue-50">
      {/* Decorative dots top-right */}
      <div className="absolute top-10 right-10 grid grid-cols-6 gap-2 opacity-40 pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        ))}
      </div>
      {/* Decorative dots bottom-left */}
      <div className="absolute bottom-10 left-6 grid grid-cols-5 gap-2 opacity-40 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
        ))}
      </div>

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24 grid lg:grid-cols-2 gap-12 items-center min-h-[90vh]">
        {/* Left content */}
        <div className="relative z-10 animate-fade-in">
          {/* Wordmark */}
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1
              className="font-serif italic font-bold text-6xl md:text-7xl leading-none"
              style={{ color: pink, fontStyle: "italic" }}
            >
              FAZ
            </h1>
            <span
              className="text-3xl md:text-4xl tracking-[0.25em] font-light"
              style={{ color: blue, fontFamily: "Helvetica, sans-serif" }}
            >
              ACADEMY
            </span>
          </div>

          {/* Tagline pills */}
          <div className="mt-4 flex items-center gap-2 flex-wrap text-[10px] md:text-xs tracking-[0.3em] uppercase text-foreground/70">
            <span className="h-px w-6 bg-blue-500" />
            <span>Fashion</span>
            <Sparkles className="w-3 h-3" style={{ color: pink }} />
            <span>Creativity</span>
            <Sparkles className="w-3 h-3" style={{ color: pink }} />
            <span>Community</span>
            <Sparkles className="w-3 h-3" style={{ color: pink }} />
            <span>Future</span>
            <span className="h-px w-6 bg-blue-500" />
          </div>

          {/* Headline */}
          <h2 className="mt-10 font-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05] tracking-tight">
            <span style={{ color: "hsl(222 47% 15%)" }}>Where </span>
            <span style={{ color: pink }} className="italic">Passion</span>
            <Sparkles className="inline-block w-6 h-6 ml-2 align-middle" style={{ color: pink }} />
            <br />
            <span style={{ color: "hsl(222 47% 15%)" }}>Becomes </span>
            <span style={{ color: blue }} className="italic">Purpose.</span>
          </h2>

          {/* Description */}
          <p className="mt-6 max-w-md text-sm md:text-base text-foreground/70 leading-relaxed">
            FAZ Academy adalah wadah bagi kreator, desainer, dan inovator mode untuk{" "}
            <span style={{ color: pink }} className="font-medium">belajar, berkembang,</span> dan{" "}
            <span style={{ color: pink }} className="font-medium">menginspirasi dunia.</span>
          </p>

          {/* CTA */}
          <div className="mt-8 flex gap-4">
            <Button
              size="lg"
              className="rounded-full px-8 text-xs tracking-[0.2em] uppercase"
              style={{ background: `linear-gradient(135deg, ${pink}, ${blue})`, color: "white" }}
              asChild
            >
              <Link to={user ? "/kelas" : "/daftar"}>
                {user ? "Cari Kelas" : "Mulai Belajar"}
              </Link>
            </Button>
          </div>

          {/* Feature icons */}
          <div className="mt-12 flex items-start gap-4 md:gap-6">
            {features.map(({ icon: Icon, label }, idx) => (
              <div key={idx} className="flex flex-col items-center text-center flex-1">
                <div
                  className="w-12 h-12 md:w-14 md:h-14 rounded-lg border flex items-center justify-center"
                  style={{ borderColor: idx % 2 === 0 ? pink : blue }}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" style={{ color: idx % 2 === 0 ? pink : blue }} />
                </div>
                <span className="mt-2 text-[9px] md:text-[10px] tracking-[0.15em] uppercase text-foreground/70 whitespace-pre-line leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right image */}
        <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="absolute -top-10 -right-10 w-72 h-72 rounded-full blur-3xl opacity-40"
            style={{ background: `radial-gradient(circle, ${pink}, transparent 70%)` }}
          />
          <div className="absolute -bottom-10 -left-10 w-72 h-72 rounded-full blur-3xl opacity-40"
            style={{ background: `radial-gradient(circle, ${blue}, transparent 70%)` }}
          />
          <img
            src={heroFashion}
            alt="FAZ Academy fashion atelier with draped mannequins"
            className="relative w-full h-auto object-cover rounded-2xl"
            width={1280}
            height={1280}
          />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
