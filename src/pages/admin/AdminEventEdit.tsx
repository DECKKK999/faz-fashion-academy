import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { api, type EventItem } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const AdminEventEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventItem | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<EventItem>(`/events/${id}`)
      .then(setEvent)
      .catch((e) => toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" }));
  }, [id]);

  const save = async () => {
    if (!event) return;
    setSaving(true);
    try {
      await api.patch(`/events/${event.id}`, {
        title: event.title,
        slug: event.slug,
        category: event.category,
        date_label: event.date_label,
        time_label: event.time_label,
        location: event.location,
        address: event.address,
        price_idr: event.price_idr,
        is_free: event.is_free,
        spots: event.spots,
        spots_left: event.spots_left,
        speaker: event.speaker,
        description: event.description,
        highlights: event.highlights.filter((h) => h.trim() !== ""),
        cover_image_url: event.cover_image_url,
        is_published: event.is_published,
        position: event.position,
      });
      toast({ title: "Event disimpan" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const setHighlight = (i: number, value: string) => {
    if (!event) return;
    const highlights = [...event.highlights];
    highlights[i] = value;
    setEvent({ ...event, highlights });
  };

  const addHighlight = () => {
    if (!event) return;
    setEvent({ ...event, highlights: [...event.highlights, ""] });
  };

  const removeHighlight = (i: number) => {
    if (!event) return;
    setEvent({ ...event, highlights: event.highlights.filter((_, idx) => idx !== i) });
  };

  if (!event) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-10 max-w-3xl">
      <Link to="/admin/events" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={13} /> Back to Events
      </Link>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Edit Event</p>
          <h1 className="text-3xl">{event.title || "Untitled"}</h1>
        </div>
        <Button onClick={save} disabled={saving} className="rounded-none">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="border border-border/50 p-6 grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Title</Label>
          <Input value={event.title} onChange={(e) => setEvent({ ...event, title: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Slug</Label>
          <Input value={event.slug} onChange={(e) => setEvent({ ...event, slug: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Category</Label>
          <Input value={event.category ?? ""} onChange={(e) => setEvent({ ...event, category: e.target.value })} className="mt-1.5" placeholder="Workshop / Seminar / ..." />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Date (label)</Label>
          <Input value={event.date_label ?? ""} onChange={(e) => setEvent({ ...event, date_label: e.target.value })} className="mt-1.5" placeholder="26 April 2026" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Time (label)</Label>
          <Input value={event.time_label ?? ""} onChange={(e) => setEvent({ ...event, time_label: e.target.value })} className="mt-1.5" placeholder="10:00 — 16:00 WIB" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Location</Label>
          <Input value={event.location ?? ""} onChange={(e) => setEvent({ ...event, location: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Address</Label>
          <Input value={event.address ?? ""} onChange={(e) => setEvent({ ...event, address: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Speaker</Label>
          <Input value={event.speaker ?? ""} onChange={(e) => setEvent({ ...event, speaker: e.target.value })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Description</Label>
          <Textarea rows={3} value={event.description ?? ""} onChange={(e) => setEvent({ ...event, description: e.target.value })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Cover Image URL</Label>
          <Input value={event.cover_image_url ?? ""} onChange={(e) => setEvent({ ...event, cover_image_url: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Price (IDR)</Label>
          <Input type="number" value={event.price_idr} onChange={(e) => setEvent({ ...event, price_idr: Number(e.target.value) || 0 })} className="mt-1.5" disabled={event.is_free} />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Switch checked={event.is_free} onCheckedChange={(v) => setEvent({ ...event, is_free: v })} />
          <Label className="text-[11px] tracking-editorial uppercase">Gratis</Label>
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Total Spots</Label>
          <Input type="number" value={event.spots ?? 0} onChange={(e) => setEvent({ ...event, spots: Number(e.target.value) || null })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Spots Left</Label>
          <Input type="number" value={event.spots_left ?? 0} onChange={(e) => setEvent({ ...event, spots_left: Number(e.target.value) || null })} className="mt-1.5" />
        </div>

        {/* Highlights */}
        <div className="col-span-2">
          <div className="flex items-center justify-between mb-2">
            <Label className="text-[10px] tracking-editorial uppercase">Highlights (Yang Kamu Dapatkan)</Label>
            <Button onClick={addHighlight} variant="ghost" size="sm" className="gap-1 h-7">
              <Plus size={13} /> Add
            </Button>
          </div>
          <div className="space-y-2">
            {event.highlights.length === 0 && (
              <p className="text-[11px] text-muted-foreground">Belum ada highlight.</p>
            )}
            {event.highlights.map((h, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input value={h} onChange={(e) => setHighlight(i, e.target.value)} className="h-8 text-sm" placeholder={`Highlight ${i + 1}`} />
                <Button size="sm" variant="ghost" onClick={() => removeHighlight(i)}>
                  <Trash2 size={13} />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Position</Label>
          <Input type="number" value={event.position} onChange={(e) => setEvent({ ...event, position: Number(e.target.value) || 0 })} className="mt-1.5" />
        </div>
        <div className="flex items-center gap-3 pt-7">
          <Switch checked={event.is_published} onCheckedChange={(v) => setEvent({ ...event, is_published: v })} />
          <Label className="text-[11px] tracking-editorial uppercase">Published</Label>
        </div>
      </div>
    </div>
  );
};

export default AdminEventEdit;
