import { Link } from "react-router-dom";
import fazWordmark from "@/assets/faz-wordmark.png";

const footerLinks = [
  { label: "Kelas", href: "/kelas" },
  { label: "Tentang", href: "/tentang" },
  { label: "Verifikasi Sertifikat", href: "/verifikasi" },
  { label: "Kontak", href: "/kontak" },
  { label: "Kebijakan Pengembalian", href: "/kebijakan-pengembalian" },
  { label: "Privasi", href: "/kebijakan-privasi" },
];

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-14 px-8 md:px-16">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-10 pb-10 border-b border-border/50">
          <div>
            <img src={fazWordmark} alt="FAZ Academy" className="h-6 w-auto mb-4 wordmark-adaptive" />
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed" style={{ letterSpacing: "normal", textTransform: "none" }}>
              Rumah bagi desainer, akademisi, dan praktisi fashion Indonesia untuk berbagi ilmu dan warisan budaya.
            </p>
          </div>
          <nav className="flex flex-wrap gap-x-8 gap-y-3">
            {footerLinks.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className="text-[12px] tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="pt-8 text-center md:text-left text-[11px] tracking-wide-editorial uppercase text-muted-foreground">
          © 2026 FAZ Academy. Hak Cipta Dilindungi.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
