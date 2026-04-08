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
    <section className="py-32 px-6">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          <div className="lg:col-span-4 lg:sticky lg:top-24">
            <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight mb-4 leading-tight">
              Semua yang kamu butuhkan.
            </h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              Satu platform lengkap untuk perjalanan karirmu di dunia fashion.
            </p>
          </div>
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden">
            {features.map((feature) => (
              <div key={feature.title} className="p-8 bg-background hover:bg-secondary transition-colors duration-300 group">
                <feature.icon size={24} className="text-muted-foreground mb-5 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
                <h3 className="text-sm font-semibold text-foreground mb-2 tracking-wide uppercase">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
