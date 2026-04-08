import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-20 bg-foreground">
      <div className="container mx-auto px-4 text-center">
        <p className="text-gold text-sm tracking-[0.2em] uppercase mb-4 font-sans">Siap Memulai?</p>
        <h2 className="font-serif text-3xl md:text-5xl font-bold text-primary-foreground mb-6">
          Mulai Perjalanan Fashion-mu<br />Hari Ini
        </h2>
        <p className="text-primary-foreground/60 max-w-lg mx-auto mb-10">
          Daftar gratis dan akses kelas percobaan, e-book sampel, dan komunitas FAZ Academy.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="hero" size="lg" asChild>
            <Link to="/daftar">Daftar Gratis Sekarang</Link>
          </Button>
          <Button variant="hero-outline" size="lg" asChild>
            <Link to="/kelas">Lihat Katalog</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
