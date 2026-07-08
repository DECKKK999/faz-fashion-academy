import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, LogOut, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import fazWordmark from "@/assets/faz-wordmark.png";
import CartButton from "@/components/CartButton";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";


const navLinks = [
  { label: "Kelas", href: "/kelas" },
  { label: "Tentang", href: "/tentang" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
    navigate("/");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4 sm:px-8 md:px-16">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="flex items-center" aria-label="FAZ Academy — Beranda">
            <img src={fazWordmark} alt="FAZ Academy" className="h-6 md:h-7 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[14px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/wishlist" aria-label="Wishlist" className="text-muted-foreground hover:text-foreground transition-colors">
              <Heart size={18} />
            </Link>
            <CartButton />
            {user ? (
              <>
                <Button size="sm" className="h-7 text-[13px] tracking-editorial uppercase rounded-none px-5 bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20" asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </Button>
                <Link to="/akun" className="text-[14px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors">
                  Akun
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-[14px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <LogOut size={13} />
                  Keluar
                </button>
              </>
            ) : (
              <>
                <Link to="/masuk" className="text-[14px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors">
                  Masuk
                </Link>
                <Button size="sm" className="h-7 text-[13px] tracking-editorial uppercase rounded-none px-5 bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20" asChild>
                  <Link to="/daftar">Daftar</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <button className="text-foreground p-1">
                <Menu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] bg-background border-border">
              <SheetHeader>
                <SheetTitle className="text-xs tracking-wide-editorial uppercase font-light text-foreground text-left">
                  FAZ Academy
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-6 mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="text-sm tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link to="/keranjang" className="text-sm tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>Keranjang</Link>
                <Link to="/wishlist" className="text-sm tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground" onClick={() => setIsOpen(false)}>Wishlist</Link>
                <div className="border-t border-border/50 pt-6 flex flex-col gap-3">
                  {user ? (
                    <>
                      <Button size="sm" asChild className="w-full rounded-none text-[11px] tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20">
                        <Link to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="w-full rounded-none text-[11px] tracking-editorial uppercase">
                        <Link to="/akun" onClick={() => setIsOpen(false)}>Akun</Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSignOut}
                        className="w-full rounded-none text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground flex items-center gap-2"
                      >
                        <LogOut size={14} />
                        Keluar
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" asChild className="w-full text-[11px] tracking-editorial uppercase rounded-none">
                        <Link to="/masuk" onClick={() => setIsOpen(false)}>Masuk</Link>
                      </Button>
                      <Button size="sm" asChild className="w-full rounded-none text-[11px] tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20">
                        <Link to="/daftar" onClick={() => setIsOpen(false)}>Daftar</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
