import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import GrainOverlay from "@/components/landing/GrainOverlay";
import Kicker from "@/components/landing/Kicker";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background overflow-hidden">
      <GrainOverlay />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[480px] rounded-full blur-[120px] opacity-20 pointer-events-none bg-primary" />
      <div className="relative text-center px-6">
        <Kicker className="justify-center mb-4">Halaman Tidak Ditemukan</Kicker>
        <h1 className="font-serif text-7xl md:text-8xl text-foreground mb-4">404</h1>
        <p className="mb-8 text-muted-foreground">Halaman yang kamu cari tidak ada, atau sudah dipindahkan.</p>
        <Button asChild variant="gradient" className="rounded-full px-8">
          <Link to="/">Kembali ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
