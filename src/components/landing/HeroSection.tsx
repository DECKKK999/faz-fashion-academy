import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="min-h-screen flex flex-col justify-end px-6 pb-16 pt-24 bg-background text-foreground">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <div className="lg:col-span-7">
            <p className="text-xs tracking-[0.3em] uppercase text-muted-foreground mb-6 animate-fade-in">
              Fashion A-Z Academy
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] xl:text-[6.5rem] font-semibold leading-[0.95] tracking-tight animate-fade-in" style={{ animationDelay: "0.1s" }}>
              Discover
              <br />
              <span className="font-serif italic font-normal">the art of</span>
              <br />
              Fashion.
            </h1>
          </div>
          <div className="lg:col-span-5 lg:pb-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-md mb-8">
              Platform pembelajaran online terlengkap untuk industri fashion Indonesia. Dari desain hingga bisnis — kuasai semuanya di sini.
            </p>
            <div className="flex gap-3">
              <Button size="lg" className="rounded-full px-8 text-sm" asChild>
                <Link to="/daftar">Mulai Belajar</Link>
              </Button>
              <Button variant="ghost" size="lg" className="rounded-full px-8 text-sm text-muted-foreground" asChild>
                <Link to="/kelas">Jelajahi Kelas →</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: "0.35s" }}>
          <div className="overflow-hidden rounded-lg aspect-[4/3] md:aspect-[3/2]">
            <img src="https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=600&fit=crop" alt="Desain Busana" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </div>
          <div className="overflow-hidden rounded-lg aspect-[4/3] md:aspect-[3/2]">
            <img src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=600&fit=crop" alt="Fashion Photography" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </div>
          <div className="overflow-hidden rounded-lg aspect-[4/3] md:aspect-[3/2]">
            <img src="https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800&h=600&fit=crop" alt="Personal Styling" className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
