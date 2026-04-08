import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-32 px-6 md:px-16">
      <div className="container mx-auto max-w-3xl text-center">
        <p className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground mb-6">
          Bergabung Sekarang
        </p>
        <h2 className="text-3xl md:text-5xl font-light tracking-editorial text-foreground mb-4">
          Siap Memulai?
        </h2>
        <p className="font-display italic text-2xl md:text-3xl text-foreground/70 mb-10" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
          Wujudkan karirmu di dunia fashion.
        </p>
        <Button size="lg" className="rounded-none px-12 text-[11px] tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20" asChild>
          <Link to="/daftar">Daftar Gratis</Link>
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
