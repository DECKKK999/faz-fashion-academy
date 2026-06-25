import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api, type EventItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { formatRupiah } from "@/lib/format";

const AdminEvents = () => {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try {
      setEvents(await api.get<EventItem[]>("/events"));
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    const slug = `event-${Date.now()}`;
    try {
      const data = await api.post<{ id: string }>("/events", { title: "Untitled Event", slug, price_idr: 0 });
      navigate(`/admin/events/${data.id}`);
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal membuat", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus event ini?")) return;
    try {
      await api.delete(`/events/${id}`);
      toast({ title: "Event dihapus" });
      load();
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menghapus", variant: "destructive" });
    }
  };

  return (
    <div className="p-10 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl">Events</h1>
        </div>
        <Button onClick={handleCreate} className="rounded-none gap-2">
          <Plus size={14} /> New Event
        </Button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading...</p>
      ) : events.length === 0 ? (
        <div className="border border-border/50 p-12 text-center">
          <p className="text-muted-foreground mb-4">Belum ada event.</p>
          <Button onClick={handleCreate} className="rounded-none">Buat event pertama</Button>
        </div>
      ) : (
        <div className="border border-border/50">
          <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border/50 text-[10px] tracking-editorial uppercase text-muted-foreground">
            <div className="col-span-4">Title</div>
            <div className="col-span-2">Category</div>
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1 text-right">Actions</div>
          </div>
          {events.map((e) => (
            <div key={e.id} className="grid grid-cols-12 gap-4 px-5 py-4 border-b border-border/50 last:border-0 items-center text-sm">
              <div className="col-span-4">
                <p className="text-foreground">{e.title}</p>
                <p className="text-[11px] text-muted-foreground">{e.location ?? "—"}</p>
              </div>
              <div className="col-span-2 text-muted-foreground">{e.category ?? "—"}</div>
              <div className="col-span-2 text-muted-foreground text-[12px]">{e.date_label ?? "—"}</div>
              <div className="col-span-2 text-muted-foreground">{e.is_free ? "Gratis" : e.price_idr ? formatRupiah(e.price_idr) : "—"}</div>
              <div className="col-span-1">
                <span className={`text-[10px] tracking-editorial uppercase px-2 py-0.5 ${e.is_published ? "bg-foreground/10 text-foreground" : "text-muted-foreground"}`}>
                  {e.is_published ? "Live" : "Draft"}
                </span>
              </div>
              <div className="col-span-1 flex justify-end gap-1">
                <Button size="sm" variant="ghost" asChild>
                  <Link to={`/admin/events/${e.id}`}><Pencil size={14} /></Link>
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(e.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminEvents;
