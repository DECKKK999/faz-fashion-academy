import { BookOpen, Video, Award, Calendar, ShoppingBag, Users } from "lucide-react";

const features = [
  { icon: Video, title: "Kelas Video HD", description: "Materi berkualitas tinggi dengan video HD dari praktisi industri." },
  { icon: BookOpen, title: "E-Book Eksklusif", description: "Koleksi lengkap dari pakar fashion Indonesia." },
  { icon: Calendar, title: "Event & Workshop", description: "Workshop langsung, webinar, dan networking event." },
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
            <h2 className="text-2xl md:text-4xl font-light text-foreground tracking-editorial mb-4 leading-tight">
              Semua yang kamu butuhkan
            </h2>
            <p className="text-muted-foreground text-sm leading-relaxed" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
              Satu platform lengkap untuk perjalanan karirmu di dunia fashion.
            </p>
          </div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border/50 overflow-hidden">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="p-8 bg-background hover:bg-muted/50 transition-colors duration-300 group"
              >
                <feature.icon
                  size={22}
                  className="text-accent mb-5 group-hover:text-foreground transition-colors"
                  strokeWidth={1}
                />
                <h3 className="text-[11px] font-light tracking-editorial uppercase text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
