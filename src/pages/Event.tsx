import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Ticket, X, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { api, type EventItem } from "@/lib/api";
import { formatRupiah } from "@/lib/format";
import { useAuth } from "@/contexts/AuthContext";

const Event = () => {
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    api
      .get<EventItem[]>("/events")
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(events.map((e) => e.category).filter(Boolean))) as string[];
    return ["Semua", ...cats];
  }, [events]);

  const filteredEvents = activeCategory === "Semua"
    ? events
    : events.filter((e) => e.category === activeCategory);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />

      <section className="pt-28 pb-16 px-8 md:px-16">
        <div className="container mx-auto max-w-6xl">
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-4">
            Events & Workshops
          </p>
          <h1 className="text-4xl md:text-5xl font-serif italic text-foreground mb-4">
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
                    src={event.cover_image_url ?? ""}
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
                    {event.is_free ? (
                      <span className="text-[9px] tracking-[0.2em] uppercase text-accent px-3 py-1 border border-accent/30">
                        Gratis
                      </span>
                    ) : (
                      <span className="text-[10px] tracking-editorial text-foreground/80">
                        {formatRupiah(event.price_idr)}
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-serif text-foreground mb-3 group-hover:text-accent transition-colors duration-300">
                    {event.title}
                  </h3>
                  <div className="flex flex-col gap-2 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar size={12} />
                      <span>{event.date_label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={12} />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users size={12} />
                      <span>{event.spots_left} spot tersisa</span>
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

          {loading && (
            <p className="text-muted-foreground text-sm py-12">Memuat event...</p>
          )}
          {!loading && filteredEvents.length === 0 && (
            <p className="text-muted-foreground text-sm py-12">Tidak ada event yang ditemukan.</p>
          )}
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
                src={selectedEvent.cover_image_url ?? ""}
                alt={selectedEvent.title}
                className="w-full h-full object-cover"
              />
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground">
                  {selectedEvent.category}
                </span>
                {selectedEvent.is_free ? (
                  <span className="text-[9px] tracking-[0.2em] uppercase text-accent px-3 py-1 border border-accent/30">
                    Gratis
                  </span>
                ) : (
                  <span className="text-[10px] tracking-editorial text-accent">
                    {formatRupiah(selectedEvent.price_idr)}
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
                    <p className="text-xs text-foreground">{selectedEvent.date_label}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-4 border border-border/50">
                  <Clock size={16} className="text-accent mt-0.5" />
                  <div>
                    <p className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Waktu</p>
                    <p className="text-xs text-foreground">{selectedEvent.time_label}</p>
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
                    <p className="text-xs text-foreground">{selectedEvent.is_free ? "Gratis" : formatRupiah(selectedEvent.price_idr)}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{selectedEvent.spots_left} dari {selectedEvent.spots} spot tersisa</p>
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

              <Button
                onClick={() => navigate(user ? `/beli-event/${selectedEvent.id}` : `/masuk?redirect=${encodeURIComponent(`/beli-event/${selectedEvent.id}`)}`)}
                className="w-full h-11 text-[11px] tracking-[0.2em] uppercase rounded-none bg-foreground text-background hover:bg-foreground/90"
              >
                {selectedEvent.is_free ? "Daftar Sekarang — Gratis" : `Beli Tiket — ${formatRupiah(selectedEvent.price_idr)}`}
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
