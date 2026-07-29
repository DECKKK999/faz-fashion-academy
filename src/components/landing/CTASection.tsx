import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Reveal from "@/components/landing/Reveal";

const CTASection = () => {
  return (
    <section className="py-16 px-6 md:px-16">
      <Reveal className="container mx-auto max-w-5xl">
        <div className="relative overflow-hidden rounded-[28px] border border-border bg-secondary/60 text-center px-6 py-20 md:py-24">
          <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full blur-3xl opacity-40 pointer-events-none bg-[radial-gradient(ellipse,hsl(var(--primary)/0.35),hsl(var(--olive)/0.25),transparent_70%)]" />
          <div className="relative">
            <p className="font-mono-editorial text-[11px] tracking-[0.15em] uppercase text-primary mb-6">
              Bergabung Sekarang
            </p>
            <h2 className="text-3xl md:text-5xl font-light tracking-normal text-foreground mb-4">
              Siap Memulai?
            </h2>
            <p className="font-display italic text-2xl md:text-3xl text-foreground/70 mb-10" style={{ letterSpacing: 'normal', textTransform: 'none' }}>
              Wujudkan karirmu di dunia fashion.
            </p>
            <Button variant="gradient" size="lg" className="rounded-full px-12 text-[12px] tracking-editorial uppercase" asChild>
              <Link to="/daftar">Daftar Gratis</Link>
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  );
};

export default CTASection;
