import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Shirt, Lightbulb, Users, Star, Sparkles } from "lucide-react";
import fazWordmark from "@/assets/faz-wordmark.png";
import heroCharacter from "@/assets/hero-character.png";

const features = [
  { icon: Shirt, label: "Fashion\nEducation" },
  { icon: Lightbulb, label: "Creative\nInnovation" },
  { icon: Users, label: "Community\nCollaboration" },
  { icon: Star, label: "Future\nLeaders" },
];

const topics = [
  "Kebaya", "Batik", "Busana Muslim", "Tenun & Tekstil",
  "Pattern Making", "Fashion Business", "Sustainable Fashion", "Ilustrasi Mode",
];

const HeroSection = () => {
  const { user } = useAuth();

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Spotlight glow blobs — replaces the old light pink/white/blue gradient
          backdrop with a dark runway-spotlight treatment. The hero illustration
          itself already carries a soft pastel glow baked into the PNG, which
          reads like a spotlight behind the model on this darker canvas. */}
      <div className="absolute -top-48 -right-24 w-[560px] h-[560px] rounded-full blur-[120px] opacity-30 pointer-events-none bg-primary" />
      <div className="absolute -bottom-48 -left-32 w-[460px] h-[460px] rounded-full blur-[120px] opacity-20 pointer-events-none bg-olive" />

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

      <div className="relative max-w-7xl mx-auto px-6 md:px-12 pt-24 pb-16 md:pt-28 md:pb-20 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left content */}
        <div className="relative z-10 animate-fade-in">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 glass-panel rounded-full px-4 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot" />
            <span className="font-mono-editorial text-[14px] tracking-[0.1em] uppercase text-foreground/70">
              Pendaftaran batch baru dibuka
            </span>
          </div>

          {/* Wordmark */}
          <img
            src={fazWordmark}
            alt="FAZ Academy"
            className="h-10 md:h-14 lg:h-16 w-auto max-w-full wordmark-adaptive"
            width={2433}
            height={400}
          />

          {/* Tagline pills */}
          <div className="mt-5 flex items-center gap-1.5 flex-wrap font-mono-editorial text-[12px] md:text-[13px] tracking-[0.2em] uppercase text-foreground/70 max-w-[244px] md:max-w-[340px] lg:max-w-[389px]">
            <span className="h-px w-3 bg-olive" />
            <span>Fashion</span>
            <Sparkles className="w-2 h-2 text-primary" />
            <span>Creativity</span>
            <Sparkles className="w-2 h-2 text-primary" />
            <span>Community</span>
            <Sparkles className="w-2 h-2 text-primary" />
            <span>Future</span>
            <span className="h-px w-3 bg-olive" />
          </div>

          {/* Headline */}
          <h2 className="mt-16 text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.03] tracking-tight text-foreground">
            <span className="block whitespace-nowrap">
              Where <span className="text-primary italic">Passion</span>
              <Sparkles className="inline-block w-6 h-6 ml-2 align-middle text-primary" />
            </span>
            <span className="block whitespace-nowrap">
              Becomes <span className="text-olive italic">Purpose.</span>
            </span>
          </h2>

          {/* Description */}
          <p className="mt-6 max-w-md text-sm md:text-base text-foreground/70 leading-relaxed">
            FAZ Academy adalah wadah bagi kreator, desainer, dan inovator mode untuk{" "}
            <span className="text-primary font-medium">belajar, berkembang,</span> dan{" "}
            <span className="text-primary font-medium">menginspirasi dunia.</span>
          </p>

          {/* CTA */}
          <div className="mt-8 flex gap-4">
            <Button
              variant="gradient"
              size="lg"
              className="rounded-full px-8 text-xs tracking-[0.2em] uppercase"
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
                  className={`w-12 h-12 md:w-14 md:h-14 rounded-lg border flex items-center justify-center ${
                    idx % 2 === 0 ? "border-primary text-primary" : "border-olive text-olive"
                  }`}
                >
                  <Icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <span className="mt-2 text-[10px] md:text-[11px] tracking-[0.15em] uppercase text-foreground/70 whitespace-pre-line leading-tight">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right image */}
        <div className="relative animate-fade-in" style={{ animationDelay: "0.2s" }}>
          <div className="absolute top-[8%] right-0 w-[80%] aspect-square rounded-full blur-3xl opacity-60 pointer-events-none bg-[radial-gradient(circle,hsl(var(--olive)/0.15),hsl(var(--primary)/0.12),transparent_72%)]" />
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

          {/* Floating credibility chips */}
          <div className="hidden sm:flex glass-panel absolute top-[6%] -left-2 md:-left-6 rounded-2xl px-4 py-3 flex-col gap-0.5 shadow-lg animate-float-soft">
            <span className="font-mono-editorial text-[13px] uppercase tracking-wide text-muted-foreground">Sertifikat</span>
            <span className="font-serif text-sm text-foreground">Resmi &amp; Terverifikasi</span>
          </div>
          <div
            className="hidden sm:flex glass-panel absolute bottom-[10%] -right-2 md:-right-4 rounded-2xl px-4 py-3 flex-col gap-0.5 shadow-lg animate-float-soft"
            style={{ animationDelay: "1.6s" }}
          >
            <span className="font-mono-editorial text-[13px] uppercase tracking-wide text-muted-foreground">Kurikulum</span>
            <span className="font-serif text-sm text-foreground">Terstruktur Bab demi Bab</span>
          </div>
        </div>
      </div>

      {/* Topic marquee */}
      <div className="relative border-t border-border/60 py-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div className="flex gap-10 w-max animate-marquee-right">
          {[...topics, ...topics].map((topic, i) => (
            <span key={i} className="font-mono-editorial text-[15px] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
              {topic}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
