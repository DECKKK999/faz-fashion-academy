import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-32 px-6 bg-foreground text-background">
      <div className="container mx-auto max-w-3xl text-center">
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tight mb-6">
          Siap memulai?
        </h2>
        <p className="text-background/60 text-lg mb-10 max-w-md mx-auto">
          Daftar gratis dan mulai akses kelas, e-book, dan komunitas FAZ Academy.
        </p>
        <Button size="lg" className="rounded-full px-10 text-sm bg-background text-foreground hover:bg-background/90" asChild>
          <Link to="/daftar">Daftar Gratis</Link>
        </Button>
      </div>
    </section>
  );
};

export default CTASection;
