import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border py-8 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            © 2026 FAZ Academy. Hak Cipta Dilindungi.
          </p>
          <div className="flex items-center gap-6">
            {["Kelas", "E-Book", "Event", "Tentang", "Syarat & Ketentuan", "Privasi"].map((item) => (
              <Link
                key={item}
                to="/"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
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
