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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-12">
          <Link to="/" className="text-sm font-semibold tracking-tight text-foreground">
            FAZ Academy
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="text-xs font-normal text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <Link to="/masuk" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Masuk
            </Link>
            <Button size="sm" className="h-7 text-xs rounded-full px-4" asChild>
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
          <div className="md:hidden py-6 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex gap-3 pt-4">
                <Button variant="ghost" size="sm" asChild className="flex-1">
                  <Link to="/masuk">Masuk</Link>
                </Button>
                <Button size="sm" asChild className="flex-1 rounded-full">
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
