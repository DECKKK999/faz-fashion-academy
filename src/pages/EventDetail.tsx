import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, MapPin, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import WishlistButton from "@/components/WishlistButton";
import AddToCartButton from "@/components/AddToCartButton";
import { api, ApiError, type EventItem } from "@/lib/api";
import { formatRupiah } from "@/lib/format";

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api
      .get<EventItem>(`/events/slug/${slug}`)
      .then(setEvent)
      .catch((e) => {
        if (e instanceof ApiError && e.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 text-center text-muted-foreground text-sm tracking-editorial uppercase">Memuat...</div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div className="min-h-screen bg-background">
        <SeoHead title="Event tidak ditemukan" />
        <Navbar />
        <div className="pt-32 pb-32 text-center">
          <p className="text-muted-foreground mb-4">Event tidak ditemukan.</p>
          <Button asChild variant="outline"><Link to="/event">Kembali ke Event</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isFree = event.is_free || event.price_idr <= 0;
  const soldOut = event.spots_left != null && event.spots_left <= 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SeoHead
        title={event.title}
        description={event.description ?? `Event ${event.title}${event.date_label ? ` — ${event.date_label}` : ""} di FAZ Academy.`}
        image={event.cover_image_url ?? undefined}
      />
      <Navbar />
      <div className="pt-24 pb-24">
        <div className="container mx-auto px-6 md:px-16 max-w-5xl">
          <Link to="/event" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-8">
            <ArrowLeft size={13} /> Event
          </Link>

          {/* Cover */}
          <div className="relative aspect-[16/9] bg-muted overflow-hidden mb-8">
            <img src={event.cover_image_url ?? ""} alt={event.title} className="w-full h-full object-cover" />
            <WishlistButton
              product_type="event"
              product_id={event.id}
              size={18}
              className="absolute top-3 right-3 w-9 h-9 bg-background/80 backdrop-blur-sm"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2">
              {event.category && (
                <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">{event.category}</span>
              )}
              <h1 className="font-serif text-3xl md:text-4xl italic text-foreground mt-2 mb-3 leading-tight">{event.title}</h1>
              {event.speaker && <p className="text-sm text-muted-foreground mb-6">oleh {event.speaker}</p>}

              {event.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-8 whitespace-pre-line">{event.description}</p>
              )}

              {event.highlights.length > 0 && (
                <div className="mb-8">
                  <p className="text-[10px] tracking-editorial uppercase text-muted-foreground mb-3">Yang Kamu Dapatkan</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {event.highlights.map((h, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                        <span className="w-1 h-1 bg-accent rounded-full" /> {h}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="border border-border rounded-lg p-6 sticky top-24 space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar size={16} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-editorial uppercase text-muted-foreground">Tanggal</p>
                    <p className="text-sm text-foreground">{event.date_label || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock size={16} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-editorial uppercase text-muted-foreground">Waktu</p>
                    <p className="text-sm text-foreground">{event.time_label || "-"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin size={16} className="text-accent mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] tracking-editorial uppercase text-muted-foreground">Lokasi</p>
                    <p className="text-sm text-foreground">{event.location || "-"}</p>
                    {event.address && <p className="text-[11px] text-muted-foreground mt-0.5">{event.address}</p>}
                  </div>
                </div>
                {event.spots_left != null && (
                  <div className="flex items-start gap-3">
                    <Users size={16} className="text-accent mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[9px] tracking-editorial uppercase text-muted-foreground">Sisa Spot</p>
                      <p className="text-sm text-foreground">{event.spots_left}{event.spots != null ? ` / ${event.spots}` : ""} tersisa</p>
                    </div>
                  </div>
                )}

                <div className="border-t border-border pt-4">
                  <p className="text-[9px] tracking-editorial uppercase text-muted-foreground mb-1 flex items-center gap-1"><Ticket size={12} /> Tiket</p>
                  <p className="text-2xl font-serif font-bold text-accent mb-4">{isFree ? "Gratis" : formatRupiah(event.price_idr)}</p>

                  {soldOut ? (
                    <Button disabled className="w-full">Tiket Habis</Button>
                  ) : (
                    <div className="space-y-2">
                      <Button asChild className="w-full">
                        <Link to={`/beli-event/${event.id}`}>{isFree ? "Daftar Sekarang" : "Beli Tiket"}</Link>
                      </Button>
                      {!isFree && (
                        <AddToCartButton product_type="event" product_id={event.id} className="w-full gap-2" label="Tambah ke Keranjang" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default EventDetail;
