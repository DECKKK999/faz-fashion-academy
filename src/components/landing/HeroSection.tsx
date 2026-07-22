import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shirt, Lightbulb, Users, Star, Sparkles } from "lucide-react";
import fazWordmark from "@/assets/faz-wordmark.png";
import heroCharacter from "@/assets/hero-character.png";

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

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-16 md:pt-24 md:pb-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="relative z-10 animate-fade-in">
          {/* Wordmark */}
          <img
            src={fazWordmark}
            alt="FAZ Academy"
            className="h-10 md:h-14 lg:h-16 w-auto max-w-full"
            width={2433}
            height={400}
          />


          {/* Tagline pills */}
          <div className="mt-5 flex items-center gap-1.5 flex-wrap text-[8px] md:text-[9px] tracking-[0.2em] uppercase text-foreground/70 max-w-[244px] md:max-w-[340px] lg:max-w-[389px]">
            <span className="h-px w-3 bg-blue-500" />
            <span>Fashion</span>
            <Sparkles className="w-2 h-2" style={{ color: pink }} />
            <span>Creativity</span>
            <Sparkles className="w-2 h-2" style={{ color: pink }} />
            <span>Community</span>
            <Sparkles className="w-2 h-2" style={{ color: pink }} />
            <span>Future</span>
            <span className="h-px w-3 bg-blue-500" />
          </div>

          {/* Headline */}
          <h2 className="mt-16 text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
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
          <div className="absolute top-[8%] right-0 w-[80%] aspect-square rounded-full blur-3xl opacity-60 pointer-events-none"
            style={{ background: `radial-gradient(circle, ${blue}26, ${pink}1f, transparent 72%)` }}
          />
          {/* Cropped frame: the source PNG (hero-character.png) is left untouched; this wrapper
              scales/offsets it so only the figure (not the large transparent margin) is shown. */}
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-lg ml-auto overflow-hidden" style={{ aspectRatio: "1450 / 1870" }}>
            <img
              src={heroCharacter}
              alt="Ilustrasi desainer fashion Indonesia dengan gaun flowing gradient pink dan biru, merepresentasikan FAZ Academy sebagai platform edukasi fashion"
              className="absolute max-w-none"
              style={{ width: "148.96%", height: "auto", left: "-27.31%", top: "-11.65%" }}
              width={2160}
              height={2160}
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
