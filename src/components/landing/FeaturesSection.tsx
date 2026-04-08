import { BookOpen, Video, Award, Calendar, ShoppingBag, Users } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Kelas Video HD",
    description: "Materi berkualitas tinggi dengan video HD dan subtitle Bahasa Indonesia.",
  },
  {
    icon: BookOpen,
    title: "E-Book Eksklusif",
    description: "Koleksi e-book dari desainer dan pakar fashion Indonesia dan internasional.",
  },
  {
    icon: Calendar,
    title: "Event & Workshop",
    description: "Ikuti workshop langsung, webinar, dan fashion show virtual.",
  },
  {
    icon: Award,
    title: "Sertifikat Resmi",
    description: "Dapatkan sertifikat yang diakui industri setelah menyelesaikan kelas.",
  },
  {
    icon: ShoppingBag,
    title: "Produk Digital",
    description: "Template, pattern, dan resource digital untuk praktik langsung.",
  },
  {
    icon: Users,
    title: "Komunitas",
    description: "Bergabung dengan komunitas fashion learner dan profesional Indonesia.",
  },
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-secondary/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-primary text-sm tracking-[0.2em] uppercase mb-3 font-sans">Kenapa FAZ Academy</p>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-foreground mb-4">
            Semua yang Kamu Butuhkan dalam Satu Platform
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div
              key={feature.title}
              className="bg-card p-8 rounded-lg border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                <feature.icon size={24} className="text-primary" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-foreground mb-3">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
