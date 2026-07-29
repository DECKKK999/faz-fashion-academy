import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import GrainOverlay from "@/components/landing/GrainOverlay";
import Kicker from "@/components/landing/Kicker";
import Reveal from "@/components/landing/Reveal";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Video, BookOpen, Award } from "lucide-react";
import { Link } from "react-router-dom";

const offerings = [
  {
    icon: Video,
    title: "Kelas Online",
    desc: "Video kursus dari desainer dan praktisi industri fashion Indonesia, diajarkan dalam konteks dan bahasa lokal.",
  },
  {
    icon: BookOpen,
    title: "Materi Terstruktur",
    desc: "Kurikulum disusun bab demi bab, dari fondasi hingga teknik lanjutan, sehingga mudah diikuti dari nol.",
  },
  {
    icon: Award,
    title: "Sertifikat Resmi",
    desc: "Sertifikat kelulusan setelah menyelesaikan seluruh materi kelas, sebagai bukti kompetensimu.",
  },
];

const heritage = [
  { label: "Kebaya", detail: "Siluet ikonik yang telah berevolusi selama berabad-abad dari busana kerajaan menjadi simbol identitas nasional.", tone: "pink" as const },
  { label: "Batik", detail: "Warisan budaya UNESCO dengan ribuan motif yang masing-masing menyimpan cerita, filosofi, dan makna spiritual.", tone: "olive" as const },
  { label: "Busana Muslim", detail: "Indonesia sebagai pelopor modest fashion global dengan inovasi desain yang memadukan syariat dan estetika kontemporer.", tone: "pink" as const },
  { label: "Tenun & Tekstil", detail: "Dari songket Palembang hingga tenun ikat NTT — kekayaan tekstil nusantara tak tertandingi.", tone: "olive" as const },
];

const marqueeTerms = ["Kebaya", "Batik Tulis", "Songket", "Tenun Ikat", "Ulos", "Modest Fashion", "Sulaman", "Wastra Nusantara"];

const Tentang = () => {
  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-28 pb-20 px-6 md:px-16">
        <div className="absolute -top-40 -left-24 w-[480px] h-[480px] rounded-full blur-[120px] opacity-25 pointer-events-none bg-primary" />
        <div className="absolute -bottom-40 -right-32 w-[420px] h-[420px] rounded-full blur-[120px] opacity-20 pointer-events-none bg-olive" />
        <div className="absolute top-8 right-8 grid grid-cols-6 gap-2 opacity-30 pointer-events-none">
          {Array.from({ length: 24 }).map((_, i) => (
            <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/40" />
          ))}
        </div>

        <div className="relative container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-7">
              <Kicker className="mb-6">Tentang Kami</Kicker>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-light text-foreground tracking-normal leading-[1.03]">
                <span className="block">Suara Lokal,</span>
                <span className="block">
                  <span className="text-primary">Pengetahuan</span>
                  <Sparkles className="inline-block w-6 h-6 md:w-8 md:h-8 ml-2 align-middle text-primary" />
                </span>
                <span className="block">
                  <span className="text-olive">Universal</span>.
                </span>
              </h1>
            </div>
            <div className="lg:col-span-5">
              <p
                className="text-sm text-muted-foreground leading-relaxed mb-6"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                FAZ Academy hadir sebagai rumah bagi para desainer, akademisi, dan praktisi fashion Indonesia untuk
                berbagi ilmu, pengalaman, dan warisan budaya mereka — dalam bahasa, konteks, dan perspektif yang
                benar-benar milik kita.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Lokal", "Terstruktur", "Terverifikasi"].map((tag) => (
                  <span
                    key={tag}
                    className="glass-panel rounded-full px-4 py-1.5 font-mono-editorial text-[12px] tracking-[0.1em] uppercase text-foreground/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-border mt-12" />
        </div>
      </section>

      {/* 01 — The Problem */}
      <section className="relative py-24 px-6 md:px-16 overflow-hidden">
        <span
          aria-hidden
          className="absolute -top-6 left-2 md:left-10 text-[180px] md:text-[260px] leading-none text-foreground/[0.03] select-none pointer-events-none"
        >
          01
        </span>
        <Reveal className="relative container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <Kicker index="01" className="mb-4">Masalah Yang Kami Lihat</Kicker>
            </div>
            <div className="lg:col-span-8">
              <h3
                className="text-2xl md:text-4xl font-light text-foreground/90 leading-snug mb-10"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                "Indonesia memiliki salah satu lanskap fashion paling kaya dan beragam di dunia — namun pengetahuan
                akademis tentang fashion kita justru didominasi oleh sumber-sumber dari luar negeri."
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

      {/* 02 — The Vision */}
      <section className="py-20 px-6 md:px-16">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-secondary/60 px-6 py-16 md:px-16 md:py-20">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[560px] h-[280px] rounded-full blur-3xl opacity-40 pointer-events-none bg-[radial-gradient(ellipse,hsl(var(--olive)/0.3),hsl(var(--primary)/0.2),transparent_70%)]" />
            <div className="relative grid grid-cols-1 lg:grid-cols-12 gap-16">
              <div className="lg:col-span-4">
                <Kicker index="02" tone="olive" className="mb-4">Visi Kami</Kicker>
              </div>
              <div className="lg:col-span-8">
                <h3
                  className="text-xl md:text-3xl font-light text-foreground leading-relaxed mb-8"
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
          </div>
        </Reveal>
      </section>

      {/* 03 — What We Offer */}
      <section className="py-24 px-6 md:px-16">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-4 lg:sticky lg:top-24">
              <Kicker index="03" className="mb-4">Yang Kami Tawarkan</Kicker>
              <p className="text-muted-foreground text-sm leading-relaxed" style={{ letterSpacing: "normal", textTransform: "none" }}>
                Tiga pilar yang membentuk pengalaman belajar di FAZ Academy.
              </p>
            </div>
            <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-px bg-border/50 overflow-hidden rounded-2xl">
              {offerings.map((item, idx) => (
                <Reveal key={item.title} delayMs={idx * 80} className="h-full">
                  <div className="p-8 bg-background hover:bg-muted/50 transition-colors duration-300 group h-full">
                    <div className="flex items-center justify-between mb-6">
                      <item.icon size={22} className="text-accent group-hover:text-foreground transition-colors" strokeWidth={1} />
                      <span className="font-mono-editorial text-[13px] text-muted-foreground/60">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                    </div>
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
                </Reveal>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* 04 — Culture / Heritage */}
      <section className="py-24 px-6 md:px-16 bg-secondary">
        <Reveal className="container mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 mb-4">
            <div className="lg:col-span-4">
              <Kicker index="04" className="mb-4">Warisan Kita</Kicker>
            </div>
            <div className="lg:col-span-8">
              <h3
                className="text-xl md:text-2xl font-light text-foreground leading-relaxed"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                Fashion Indonesia bukan sekadar tren — ia adalah cerminan dari ratusan budaya, ratusan tahun sejarah,
                dan jutaan tangan yang terus berkarya.
              </h3>
            </div>
          </div>

          <div className="border-t border-border/60">
            {heritage.map((item, idx) => (
              <Reveal key={item.label} delayMs={idx * 70}>
                <div className="group relative grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-16 py-8 border-b border-border/60 pl-6 -ml-6">
                  <span
                    className={`absolute left-0 top-0 h-full w-[2px] scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300 ${
                      item.tone === "pink" ? "bg-primary" : "bg-olive"
                    }`}
                  />
                  <div className="lg:col-span-4 flex items-baseline gap-4">
                    <span className="font-mono-editorial text-[13px] text-muted-foreground/60">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h4
                      className={`text-lg md:text-xl font-light ${
                        item.tone === "pink" ? "text-primary" : "text-olive"
                      }`}
                    >
                      {item.label}
                    </h4>
                  </div>
                  <div className="lg:col-span-8">
                    <p
                      className="text-sm text-muted-foreground leading-relaxed"
                      style={{ letterSpacing: "normal", textTransform: "none" }}
                    >
                      {item.detail}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </Reveal>

        <div className="relative mt-16 border-y border-border/60 py-4 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
          <div className="flex gap-10 w-max animate-marquee-right">
            {[...marqueeTerms, ...marqueeTerms].map((term, i) => (
              <span key={i} className="font-mono-editorial text-[14px] uppercase tracking-[0.15em] text-muted-foreground whitespace-nowrap">
                {term}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 md:px-16">
        <Reveal className="container mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[28px] border border-border bg-secondary/60 text-center px-6 py-20 md:py-24">
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[520px] h-[260px] rounded-full blur-3xl opacity-40 pointer-events-none bg-[radial-gradient(ellipse,hsl(var(--primary)/0.35),hsl(var(--olive)/0.25),transparent_70%)]" />
            <div className="relative">
              <Kicker className="justify-center mb-6">Ajakan</Kicker>
              <h2 className="text-3xl md:text-5xl font-light tracking-normal text-foreground mb-4">
                Bergabunglah
              </h2>
              <p
                className="font-display italic text-xl md:text-2xl text-foreground/70 max-w-md mx-auto mb-10"
                style={{ letterSpacing: "normal", textTransform: "none" }}
              >
                Baik sebagai pengajar yang ingin berbagi ilmu, atau learner yang ingin belajar dari yang terbaik.
              </p>
              <Button variant="gradient" size="lg" className="rounded-full px-8 text-xs tracking-[0.2em] uppercase" asChild>
                <Link to="/daftar">
                  Mulai Sekarang <ArrowRight size={14} className="ml-1" />
                </Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </section>

      <Footer />
    </div>
  );
};

export default Tentang;
