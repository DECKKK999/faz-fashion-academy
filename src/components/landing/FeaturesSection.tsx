import { BookOpen, Video, Award, Calendar, ShoppingBag, Users } from "lucide-react";

const features = [
  { icon: Video, title: "Kelas Video HD", description: "Materi berkualitas tinggi dengan video HD." },
  { icon: BookOpen, title: "E-Book Eksklusif", description: "Koleksi dari pakar fashion Indonesia." },
  { icon: Calendar, title: "Event & Workshop", description: "Workshop langsung dan webinar." },
  { icon: Award, title: "Sertifikat Resmi", description: "Diakui oleh industri fashion." },
  { icon: ShoppingBag, title: "Produk Digital", description: "Template dan resource praktik." },
  { icon: Users, title: "Komunitas", description: "Jaringan profesional fashion." },
];

const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 bg-secondary">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-5xl font-semibold text-foreground tracking-tight mb-4">
            Semua yang kamu butuhkan.
          </h2>
          <p className="text-muted-foreground text-lg max-w-lg mx-auto">
            Satu platform lengkap untuk perjalanan fashion-mu.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-8 rounded-2xl hover:bg-background transition-colors duration-300 group"
            >
              <feature.icon size={28} className="text-muted-foreground mb-4 group-hover:text-foreground transition-colors" strokeWidth={1.5} />
              <h3 className="text-base font-medium text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
