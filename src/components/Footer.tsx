import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-10 px-8 md:px-16">
      <div className="container mx-auto max-w-7xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-[10px] tracking-wide-editorial uppercase text-muted-foreground">
            © 2026 FAZ Academy. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-8">
            {["Kelas", "E-Book", "Event", "Tentang", "Privasi"].map((item) => (
              <Link
                key={item}
                to="/"
                className="text-[10px] tracking-editorial uppercase text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
