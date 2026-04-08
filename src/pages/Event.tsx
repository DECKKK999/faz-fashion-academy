import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, Clock, Ticket, X, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const categories = ["Semua", "Workshop", "Seminar", "Talkshow", "Exhibition", "Networking"];

const allEvents = [
  {
    id: 1,
    title: "Pattern Making Workshop: Kebaya Modern",
    category: "Workshop",
    date: "26 April 2026",
    time: "10:00 — 16:00 WIB",
    location: "FAZ Studio, Jakarta Selatan",
    address: "Jl. Kemang Raya No. 12, Jakarta 12730",
    price: "Rp 350.000",
    isFree: false,
    spots: 20,
    spotsLeft: 7,
    speaker: "Rina Setiawan",
    description: "Workshop intensif satu hari mempelajari teknik pembuatan pola kebaya modern. Peserta akan belajar dari dasar hingga menghasilkan pola siap potong untuk kebaya kontemporer.",
    highlights: ["Material & alat disediakan", "Sertifikat kehadiran", "Makan siang included", "Take-home pattern kit"],
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop",
  },
  {
    id: 2,
    title: "Sustainable Fashion Talk: Masa Depan Tekstil Indonesia",
    category: "Talkshow",
    date: "3 Mei 2026",
    time: "14:00 — 17:00 WIB",
    location: "Online via Zoom",
    address: "Link akan dikirim via email H-1",
    price: "Gratis",
    isFree: true,
    spots: 200,
    spotsLeft: 84,
    speaker: "Dr. Ayu Larasati & Made Surya",
    description: "Diskusi mendalam tentang masa depan industri tekstil Indonesia yang berkelanjutan. Menampilkan perspektif dari akademisi dan praktisi dalam menghadapi tantangan fast fashion.",
    highlights: ["Gratis & terbuka untuk umum", "Sesi tanya jawab interaktif", "E-certificate", "Recording tersedia 7 hari"],
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=500&fit=crop",
  },
  {
    id: 3,
    title: "Batik Contemporary: From Heritage to High Fashion",
    category: "Exhibition",
    date: "10 — 15 Mei 2026",
    time: "10:00 — 20:00 WIB",
    location: "Museum Tekstil Jakarta",
    address: "Jl. Aipda KS Tubun No.2-4, Tanah Abang, Jakarta",
    price: "Rp 50.000",
    isFree: false,
    spots: 500,
    spotsLeft: 312,
    speaker: "Kurator: Dian Pratama",
    description: "Pameran yang menampilkan evolusi batik dari warisan budaya menjadi elemen high fashion kontemporer. Menampilkan karya dari 15 desainer muda Indonesia.",
    highlights: ["15 desainer muda Indonesia", "Guided tour setiap jam 11 & 15", "Workshop mini gratis", "Katalog pameran digital"],
    image: "https://images.unsplash.com/photo-1594122230689-45899d9e6f69?w=800&h=500&fit=crop",
  },
  {
    id: 4,
    title: "Fashion Business Networking Night",
    category: "Networking",
    date: "18 Mei 2026",
    time: "18:00 — 21:00 WIB",
    location: "Potato Head, Jakarta",
    address: "Jl. Gatot Subroto Kav.18, SCBD, Jakarta",
    price: "Rp 150.000",
    isFree: false,
    spots: 50,
    spotsLeft: 12,
    speaker: "Host: FAZ Academy Team",
    description: "Malam networking eksklusif untuk para pelaku industri fashion Indonesia. Kesempatan untuk bertemu desainer, buyer, dan investor dalam suasana santai.",
    highlights: ["Welcome drink & canapés", "Speed networking session", "Brand showcase corner", "Exclusive goodie bag"],
    image: "https://images.unsplash.com/photo-1511578314322-379afb476865?w=800&h=500&fit=crop",
  },
  {
    id: 5,
    title: "Draping Masterclass: Teknik Couture",
    category: "Workshop",
    date: "24 Mei 2026",
    time: "09:00 — 17:00 WIB",
    location: "FAZ Studio, Jakarta Selatan",
    address: "Jl. Kemang Raya No. 12, Jakarta 12730",
    price: "Rp 500.000",
    isFree: false,
    spots: 15,
    spotsLeft: 3,
    speaker: "Hana Wijaya",
    description: "Masterclass eksklusif teknik draping untuk couture. Belajar langsung dari desainer berpengalaman tentang teknik manipulasi kain pada mannequin.",
    highlights: ["Kelas kecil maksimal 15 orang", "Material premium disediakan", "Lunch & coffee break", "Portfolio photo session"],
    image: "https://images.unsplash.com/photo-1558171813-4c088753af8f?w=800&h=500&fit=crop",
  },
  {
    id: 6,
    title: "Seminar: Intellectual Property dalam Fashion",
    category: "Seminar",
    date: "1 Juni 2026",
    time: "13:00 — 16:00 WIB",
    location: "Online via Zoom",
    address: "Link akan dikirim via email H-1",
    price: "Gratis",
    isFree: true,
    spots: 300,
    spotsLeft: 178,
    speaker: "Adv. Budi Hartono & Sari Indah",
    description: "Seminar tentang pentingnya perlindungan hak kekayaan intelektual bagi desainer fashion Indonesia. Dari hak cipta desain hingga trademark brand.",
    highlights: ["Gratis untuk anggota FAZ", "Template legal gratis", "Konsultasi singkat 1-on-1", "E-certificate"],
    image: "https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=500&fit=crop",
  },
];

const Event = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedEvent, setSelectedEvent] = useState<typeof allEvents[0] | null>(null);

  const filteredEvents = activeCategory === "Semua"
    ? allEvents
    : allEvents.filter((e) => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-28 pb-16 px-8 md:px-16">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Events & Workshops
          </p>
          <h1 className="text-4xl md:text-5xl italic text-foreground mb-4">
            Upcoming Events
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Workshop, seminar, dan event eksklusif dari komunitas fashion Indonesia. Belajar langsung dari para praktisi dan bangun koneksi di industri.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="px-8 md:px-16 pb-12">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`text-[10px] tracking-[0.2em] uppercase px-5 py-2 border transition-all duration-300 ${
                  activeCategory === cat
                    ? "border-foreground/60 text-foreground bg-foreground/10"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="px-8 md:px-16 pb-24">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {filteredEvents.map((event) => (
              <button
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="group text-left border border-border/50 bg-card hover:border-foreground/20 transition-all duration-500"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                    loading="lazy"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                      {event.category}
                    </span>
                    {event.isFree ? (
                      <span className="text-[9px] tracking-[0.2em] uppercase text-accent px-3 py-1 border border-accent/30">
                        Gratis
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-editorial text-foreground/80">
                        {event.price}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif text-foreground mb-3 group-hover:text-accent transition-colors duration-300">
                    {event.title}
                  </h3>
                  <div className="flex flex-col gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      <span>{event.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={12} />
                      <span>{event.spotsLeft} spot tersisa</span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-foreground/60 group-hover:text-foreground transition-colors">
                    <span>Lihat Detail</span>
                    <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedEvent(null)}
          />
          <div className="relative bg-card border border-border/50 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            <button
              onClick={() => setSelectedEvent(null)}
              className="absolute top-4 right-4 z-10 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>

            <div className="aspect-[16/9] overflow-hidden">
              <img
                src={selectedEvent.image}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                  {selectedEvent.category}
                </span>
                {selectedEvent.isFree ? (
                  <span className="text-[9px] tracking-[0.2em] uppercase text-accent px-3 py-1 border border-accent/30">
                    Gratis
                  </span>
                ) : (
                  <span className="text-[10px] tracking-editorial text-accent">
                    {selectedEvent.price}
                  </span>
                )}
              </div>

              <h2 className="text-2xl font-serif italic text-foreground mb-2">
                {selectedEvent.title}
              </h2>
              <p className="text-xs text-muted-foreground mb-6">
                oleh {selectedEvent.speaker}
              </p>

              <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                {selectedEvent.description}
              </p>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                <div className="flex items-start gap-3 p-4 border border-border/50">
                  <Calendar size={16} className="text-accent mt-0.5" />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Tanggal</p>
                    <p className="text-xs text-foreground">{selectedEvent.date}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-border/50">
                  <Clock size={16} className="text-accent mt-0.5" />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Waktu</p>
                    <p className="text-xs text-foreground">{selectedEvent.time}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-border/50">
                  <MapPin size={16} className="text-accent mt-0.5" />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Lokasi</p>
                    <p className="text-xs text-foreground">{selectedEvent.location}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedEvent.address}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-border/50">
                  <Ticket size={16} className="text-accent mt-0.5" />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Tiket</p>
                    <p className="text-xs text-foreground">{selectedEvent.isFree ? "Gratis" : selectedEvent.price}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedEvent.spotsLeft} dari {selectedEvent.spots} spot tersisa</p>
                  </div>
                </div>
              </div>

              {/* Highlights */}
              <div className="mb-8">
                <p className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-3">Yang Kamu Dapatkan</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedEvent.highlights.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-foreground/80">
                      <span className="w-1 h-1 bg-accent rounded-full" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>

              <Button className="w-full h-11 text-[11px] tracking-[0.2em] uppercase rounded-none bg-foreground text-background hover:bg-foreground/90">
                {selectedEvent.isFree ? "Daftar Sekarang — Gratis" : `Beli Tiket — ${selectedEvent.price}`}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default Event;
