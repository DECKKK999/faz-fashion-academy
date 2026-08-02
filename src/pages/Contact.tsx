import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import PageHeader from "@/components/PageHeader";
import { Mail, MapPin, Clock, MessageCircle } from "lucide-react";

const prose = "text-sm text-muted-foreground leading-relaxed";
const proseStyle = { letterSpacing: "normal", textTransform: "none" } as const;

const Contact = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-4 max-w-2xl">
          <PageHeader kicker="Bantuan" title="Kontak" subtitle="Hubungi kami untuk pertanyaan seputar pesanan, pembayaran, atau akun." />

          <section className="glass-panel rounded-2xl p-6 md:p-8 shadow-lg space-y-6">
            <div className="flex items-start gap-4">
              <Mail size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">Email</p>
                <a href="mailto:fazacademy.id@gmail.com" className={`${prose} text-foreground hover:text-primary transition-colors`} style={proseStyle}>
                  fazacademy.id@gmail.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MessageCircle size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">WhatsApp</p>
                <a
                  href="https://wa.me/6281111816090"
                  target="_blank"
                  rel="noreferrer"
                  className={`${prose} text-foreground hover:text-primary transition-colors`}
                  style={proseStyle}
                >
                  +62 811-1181-6090
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">Jam Layanan</p>
                <p className={prose} style={proseStyle}>Senin–Jumat, 09.00–17.00 WIB</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">Alamat</p>
                <p className={prose} style={proseStyle}>
                  EIGHTYEIGHT@Kasablanka Office Tower A Lt. 32 A, Jalan Casablanca Raya Kavling 88, Desa/Kelurahan
                  Menteng Dalam, Kec. Tebet, Kota Adm. Jakarta Selatan, Provinsi DKI Jakarta, 12870
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;
