import { BookOpen, Video, Award, Calendar, ShoppingBag, Users } from "lucide-react";
import Kicker from "@/components/landing/Kicker";
import Reveal from "@/components/landing/Reveal";

const features = [
  { icon: Video, title: "Kelas Video HD", description: "Materi berkualitas tinggi dengan video HD dari praktisi industri." },
  { icon: BookOpen, title: "Materi Terstruktur", description: "Kurikulum bab demi bab, dari fondasi hingga teknik lanjutan." },
  { icon: Calendar, title: "Belajar Fleksibel", description: "Akses kapan saja, dari mana saja, sesuai ritmemu sendiri." },
  { icon: Award, title: "Sertifikat Resmi", description: "Diakui oleh industri fashion nasional." },
  { icon: ShoppingBag, title: "Produk Digital", description: "Template, pattern, dan resource siap pakai." },
  { icon: Users, title: "Komunitas", description: "Jaringan profesional dan sesama learner." },
];

const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 md:px-16 bg-secondary">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <Kicker index="03" className="mb-4">Platform</Kicker>
            <h2 className="text-3xl md:text-5xl font-light text-foreground tracking-normal mb-4 leading-tight">
              Semua yang kamu butuhkan
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
              Satu platform lengkap untuk perjalanan karirmu di dunia fashion.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50 overflow-hidden">
            {features.map((feature, idx) => (
              <Reveal key={feature.title} delayMs={idx * 60} className="h-full">
                <div className="p-8 bg-background hover:bg-muted/50 transition-colors duration-300 group h-full">
                  <div className="flex items-center justify-between mb-5">
                    <feature.icon
                      size={22}
                      className="text-accent group-hover:text-foreground transition-colors"
                      strokeWidth={1}
                    />
                    <span className="font-mono-editorial text-[14px] text-muted-foreground/60">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 className="text-[12px] font-light tracking-editorial uppercase text-foreground mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
                    {feature.description}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
