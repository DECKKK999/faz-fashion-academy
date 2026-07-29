import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import Kicker from "@/components/landing/Kicker";
import Reveal from "@/components/landing/Reveal";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Tentang = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-20 px-6 md:px-16">
        <div className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <Kicker className="mb-6">Tentang Kami</Kicker>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-normal leading-[1.05]">
                Suara Lokal,
                <br />
                <span className="font-serif italic text-accent">Pengetahuan</span>
                <br />
                Universal
              </h1>
            </div>
            <div className="lg:col-span-5">
              <p
                className="text-sm text-muted-foreground leading-relaxed"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                FAZ Academy hadir sebagai rumah bagi para desainer, akademisi, dan praktisi fashion Indonesia untuk
                berbagi ilmu, pengalaman, dan warisan budaya mereka — dalam bahasa, konteks, dan perspektif yang
                benar-benar milik kita.
              </p>
            </div>
          </div>
          <div className="border-t border-border mt-12" />
        </div>
      </section>

      {/* The Problem */}
      <section className="py-20 px-6 md:px-16">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <Kicker index="01" className="mb-4">Masalah Yang Kami Lihat</Kicker>
            </div>
            <div className="lg:col-span-8">
              <h3
                className="text-xl md:text-2xl font-light text-foreground leading-relaxed mb-8"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                Indonesia memiliki salah satu lanskap fashion paling kaya dan beragam di dunia — namun pengetahuan
                akademis tentang fashion kita justru didominasi oleh sumber-sumber dari luar negeri.
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  Buku-buku pattern making yang kita pelajari ditulis oleh desainer Eropa dan Amerika. Kelas-kelas
                  online yang kita ikuti mengajarkan estetika dan teknik yang lahir dari tradisi Barat. Referensi
                  fashion yang kita konsumsi sehari-hari jarang sekali menyentuh konteks lokal — bagaimana potongan
                  kebaya berbeda dari corseted bodice, bagaimana draping kain batik memiliki logika konstruksi yang
                  unik, atau bagaimana busana muslim Indonesia telah berevolusi menjadi salah satu yang paling
                  inovatif di dunia.
                </p>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  Bukan berarti pengetahuan dari luar tidak berharga — tentu saja berharga. Namun ketika satu-satunya
                  lensa yang kita miliki adalah lensa asing, kita kehilangan kemampuan untuk memahami, mengartikulasikan,
                  dan mengembangkan identitas fashion kita sendiri. Para desainer Indonesia memiliki keahlian luar biasa,
                  tapi tidak memiliki platform yang tepat untuk membagikan pengetahuan itu secara terstruktur kepada
                  generasi berikutnya.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* The Vision */}
      <section className="py-20 px-6 md:px-16 bg-secondary">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <Kicker index="02" className="mb-4">Visi Kami</Kicker>
            </div>
            <div className="lg:col-span-8">
              <h3
                className="text-xl md:text-2xl font-light text-foreground leading-relaxed mb-8"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                Kami membangun ekosistem di mana desainer lokal bisa menjadi guru, dan pengetahuan fashion Indonesia
                bisa berdiri sejajar dengan literatur fashion dunia.
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  FAZ Academy adalah platform tempat para praktisi fashion Indonesia — dari desainer haute couture hingga
                  pengrajin batik tradisional, dari ilustrator fashion hingga pakar sustainable fashion — bisa menuangkan
                  keahlian mereka dalam bentuk kelas online dan video pembelajaran yang terstruktur.
                </p>
                <p
                  className="text-sm text-muted-foreground leading-relaxed"
                  style={{ letterSpacing: "normal", textTransform: "none" }}
                >
                  Kami percaya bahwa teknik membatik tulis memiliki kompleksitas yang layak dipelajari secara akademis.
                  Bahwa evolusi kebaya dari era kerajaan Jawa hingga red carpet internasional adalah studi fashion yang
                  sangat kaya. Bahwa inovasi busana muslim Indonesia telah melahirkan kategori fashion yang sepenuhnya baru.
                  Semua pengetahuan ini layak didokumentasikan, diajarkan, dan diwariskan.
                </p>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* What We Offer */}
      <section className="py-20 px-6 md:px-16">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <Kicker index="03" className="mb-4">Yang Kami Tawarkan</Kicker>
            </div>
            <div className="lg:col-span-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/50">
                {[
                  {
                    title: "Kelas Online",
                    desc: "Video kursus dari desainer dan praktisi industri fashion Indonesia, diajarkan dalam konteks dan bahasa lokal.",
                  },
                  {
                    title: "Materi Terstruktur",
                    desc: "Kurikulum disusun bab demi bab, dari fondasi hingga teknik lanjutan, sehingga mudah diikuti dari nol.",
                  },
                  {
                    title: "Sertifikat Resmi",
                    desc: "Sertifikat kelulusan setelah menyelesaikan seluruh materi kelas, sebagai bukti kompetensimu.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="p-8 bg-background hover:bg-muted/50 transition-colors duration-300"
                  >
                    <h4 className="text-[12px] font-light tracking-editorial uppercase text-foreground mb-3">
                      {item.title}
                    </h4>
                    <p
                      className="text-sm text-muted-foreground leading-relaxed"
                      style={{ letterSpacing: "normal", textTransform: "none" }}
                    >
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* Culture Block */}
      <section className="py-20 px-6 md:px-16 bg-secondary">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <Kicker index="04" className="mb-4">Warisan Kita</Kicker>
            </div>
            <div className="lg:col-span-8">
              <h3
                className="text-xl md:text-2xl font-light text-foreground leading-relaxed mb-8"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                Fashion Indonesia bukan sekadar tren — ia adalah cerminan dari ratusan budaya, ratusan tahun sejarah,
                dan jutaan tangan yang terus berkarya.
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border/50">
                {[
                  { label: "Kebaya", detail: "Siluet ikonik yang telah berevolusi selama berabad-abad dari busana kerajaan menjadi simbol identitas nasional." },
                  { label: "Batik", detail: "Warisan budaya UNESCO dengan ribuan motif yang masing-masing menyimpan cerita, filosofi, dan makna spiritual." },
                  { label: "Busana Muslim", detail: "Indonesia sebagai pelopor modest fashion global dengan inovasi desain yang memadukan syariat dan estetika kontemporer." },
                  { label: "Tenun & Tekstil", detail: "Dari songket Palembang hingga tenun ikat NTT — kekayaan tekstil nusantara tak tertandingi." },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="p-6 bg-background hover:bg-muted/50 transition-colors duration-300"
                  >
                    <h4 className="text-[12px] font-light tracking-editorial uppercase text-foreground mb-3">
                      {item.label}
                    </h4>
                    <p
                      className="text-[12px] text-muted-foreground leading-relaxed"
                      style={{ letterSpacing: "normal", textTransform: "none" }}
                    >
                      {item.detail}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* CTA */}
      <section className="py-32 px-6 md:px-16">
        <Reveal className="container mx-auto max-w-7xl text-center">
          <Kicker className="justify-center mb-4">Ajakan</Kicker>
          <h2
            className="text-2xl md:text-4xl font-light text-foreground tracking-normal mb-4"
          >
            Bergabunglah
          </h2>
          <p
            className="text-sm text-muted-foreground max-w-md mx-auto mb-10"
            style={{ letterSpacing: "normal", textTransform: "none" }}
          >
            Baik sebagai pengajar yang ingin berbagi ilmu, atau sebagai learner yang ingin belajar dari yang terbaik —
            FAZ Academy adalah tempat untuk kita semua.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              to="/daftar"
              className="inline-flex items-center gap-2 text-[12px] tracking-editorial uppercase bg-foreground/10 border border-foreground/30 text-foreground hover:bg-foreground/20 transition-colors px-6 py-3 rounded-full"
            >
              Mulai Sekarang <ArrowRight size={12} />
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
};

export default Tentang;
