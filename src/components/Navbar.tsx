import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Kelas", href: "/kelas" },
  { label: "E-Book", href: "/ebook" },
  { label: "Event", href: "/event" },
  { label: "Tentang", href: "/tentang" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/60 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-8 md:px-16">
        <div className="flex items-center justify-between h-14">
          <Link to="/" className="text-xs tracking-wide-editorial uppercase font-light text-foreground">
            FAZ Academy
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-[11px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/masuk" className="text-[11px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors">
              Masuk
            </Link>
            <Button size="sm" className="h-7 text-[10px] tracking-editorial uppercase rounded-none px-5 bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20" asChild>
              <Link to="/daftar">Daftar</Link>
            </Button>
          </div>

          <button
            className="md:hidden text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-8 animate-fade-in border-t border-border/50">
            <div className="flex flex-col gap-5">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-xs tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-4 border-t border-border/50">
                <Button variant="ghost" size="sm" asChild className="flex-1 text-[10px] tracking-editorial uppercase rounded-none">
                  <Link to="/masuk">Masuk</Link>
                </Button>
                <Button size="sm" asChild className="flex-1 rounded-none text-[10px] tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20">
                  <Link to="/daftar">Daftar</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
