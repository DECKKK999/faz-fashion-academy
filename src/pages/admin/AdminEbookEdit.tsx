import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { api, type Ebook } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

const AdminEbookEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [ebook, setEbook] = useState<Ebook | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    api
      .get<Ebook>(`/ebooks/${id}`)
      .then(setEbook)
      .catch((e) => toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal memuat", variant: "destructive" }));
  }, [id]);

  const uploadFile = async (file: File) => {
    if (!ebook) return;
    try {
      const fd = new FormData();
      fd.append("file", file);
      const updated = await api.upload<Ebook>(`/ebooks/${ebook.id}/file`, fd);
      setEbook(updated);
      toast({ title: "File PDF terunggah" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal mengunggah", variant: "destructive" });
    }
  };

  const save = async () => {
    if (!ebook) return;
    setSaving(true);
    try {
      await api.patch(`/ebooks/${ebook.id}`, {
        title: ebook.title,
        slug: ebook.slug,
        author: ebook.author,
        category: ebook.category,
        description: ebook.description,
        cover_image_url: ebook.cover_image_url,
        price_idr: ebook.price_idr,
        pages: ebook.pages,
        is_published: ebook.is_published,
        position: ebook.position,
      });
      toast({ title: "E-book disimpan" });
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Gagal menyimpan", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!ebook) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-10 max-w-3xl">
      <Link to="/admin/ebooks" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={13} /> Back to E-Books
      </Link>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Edit E-Book</p>
          <h1 className="text-3xl">{ebook.title || "Untitled"}</h1>
        </div>
        <Button onClick={save} disabled={saving} className="rounded-none">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>

      <div className="border border-border/50 p-6 grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Title</Label>
          <Input value={ebook.title} onChange={(e) => setEbook({ ...ebook, title: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Slug</Label>
          <Input value={ebook.slug} onChange={(e) => setEbook({ ...ebook, slug: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Author</Label>
          <Input value={ebook.author ?? ""} onChange={(e) => setEbook({ ...ebook, author: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Category</Label>
          <Input value={ebook.category ?? ""} onChange={(e) => setEbook({ ...ebook, category: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Pages</Label>
          <Input type="number" value={ebook.pages ?? 0} onChange={(e) => setEbook({ ...ebook, pages: Number(e.target.value) || null })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Description</Label>
          <Textarea rows={3} value={ebook.description ?? ""} onChange={(e) => setEbook({ ...ebook, description: e.target.value })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Cover Image URL</Label>
          <Input value={ebook.cover_image_url ?? ""} onChange={(e) => setEbook({ ...ebook, cover_image_url: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Price (IDR)</Label>
          <Input type="number" value={ebook.price_idr} onChange={(e) => setEbook({ ...ebook, price_idr: Number(e.target.value) || 0 })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Position</Label>
          <Input type="number" value={ebook.position} onChange={(e) => setEbook({ ...ebook, position: Number(e.target.value) || 0 })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">File PDF (untuk dijual/diunduh pembeli)</Label>
          <Input type="file" accept="application/pdf" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} className="mt-1.5" />
          <p className="text-[11px] text-muted-foreground mt-1">{ebook.file_url ? "✓ File terpasang (privat, hanya untuk pembeli)." : "Belum ada file. Unggah PDF agar bisa diunduh setelah dibeli."}</p>
        </div>
        <div className="col-span-2 flex items-center gap-3 pt-2">
          <Switch checked={ebook.is_published} onCheckedChange={(v) => setEbook({ ...ebook, is_published: v })} />
          <Label className="text-[11px] tracking-editorial uppercase">Published</Label>
        </div>
      </div>
    </div>
  );
};

export default AdminEbookEdit;
