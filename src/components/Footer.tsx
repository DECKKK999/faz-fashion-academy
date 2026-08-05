import { Link } from "react-router-dom";
import { Mail, MapPin, MessageCircle, Instagram } from "lucide-react";
import fazWordmark from "@/assets/faz-wordmark.png";

const footerLinks = [
  { label: "Kelas", href: "/kelas" },
  { label: "Tentang", href: "/tentang" },
  { label: "Verifikasi Sertifikat", href: "/verifikasi" },
  { label: "Kontak", href: "/kontak" },
  { label: "Kebijakan Pengembalian", href: "/kebijakan-pengembalian" },
  { label: "Privasi", href: "/kebijakan-privasi" },
];

const normalCase = { letterSpacing: "normal", textTransform: "none" } as const;
const contactLinkClass = "flex items-start gap-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-14 px-8 md:px-16">
      <div className="container mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 pb-10 border-b border-border/50">
          <div>
            <img src={fazWordmark} alt="FAZ Academy" className="h-6 w-auto mb-4 wordmark-adaptive" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed" style={normalCase}>
              Rumah bagi desainer, akademisi, dan praktisi fashion Indonesia untuk berbagi ilmu dan warisan budaya.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3 content-start">
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-[12px] uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="space-y-3" style={normalCase}>
            <a href="mailto:fazacademy.id@gmail.com" className={contactLinkClass}>
              <Mail size={14} className="shrink-0 mt-0.5" /> fazacademy.id@gmail.com
            </a>
            <a href="https://wa.me/6281111816090" target="_blank" rel="noreferrer" className={contactLinkClass}>
              <MessageCircle size={14} className="shrink-0 mt-0.5" /> +62 811-1181-6090
            </a>
            <a href="https://instagram.com/fazacademy.id" target="_blank" rel="noreferrer" className={contactLinkClass}>
              <Instagram size={14} className="shrink-0 mt-0.5" /> @fazacademy.id
            </a>
            <p className={contactLinkClass}>
              <MapPin size={14} className="shrink-0 mt-0.5" />
              <span>
                EIGHTYEIGHT@Kasablanka Office Tower A Lt. 32 A, Jalan Casablanca Raya Kavling 88, Jakarta Selatan,
                12870
              </span>
            </p>
          </div>
        </div>
        <p className="pt-8 text-center md:text-left text-[11px] uppercase text-muted-foreground">
          © 2026 FAZ Academy. Hak Cipta Dilindungi.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
