import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-foreground border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div>
            <span className="font-serif text-2xl font-bold text-gold-gradient">FAZ</span>
            <span className="text-primary-foreground/60 text-sm ml-2 tracking-widest uppercase">Academy</span>
            <p className="text-primary-foreground/50 text-sm mt-4 leading-relaxed">
              Platform pembelajaran online terlengkap untuk industri fashion Indonesia.
            </p>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-primary-foreground mb-4 tracking-wide">Produk</h4>
            <ul className="space-y-2">
              {["Kelas Online", "E-Book", "Event", "Sertifikasi", "Produk Digital"].map((item) => (
                <li key={item}>
                  <Link to="/kelas" className="text-sm text-primary-foreground/50 hover:text-gold transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-primary-foreground mb-4 tracking-wide">Perusahaan</h4>
            <ul className="space-y-2">
              {["Tentang Kami", "Karir", "Blog", "Hubungi Kami"].map((item) => (
                <li key={item}>
                  <Link to="/tentang" className="text-sm text-primary-foreground/50 hover:text-gold transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-sm font-semibold text-primary-foreground mb-4 tracking-wide">Legal</h4>
            <ul className="space-y-2">
              {["Syarat & Ketentuan", "Kebijakan Privasi", "FAQ"].map((item) => (
                <li key={item}>
                  <Link to="/" className="text-sm text-primary-foreground/50 hover:text-gold transition-colors">{item}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 mt-12 pt-8 text-center">
          <p className="text-primary-foreground/40 text-sm">
            © 2026 FAZ Academy. Hak Cipta Dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
