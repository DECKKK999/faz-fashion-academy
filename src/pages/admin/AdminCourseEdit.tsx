import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";

type Course = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  cover_image_url: string | null;
  instructor_name: string | null;
  price_idr: number;
  level: string | null;
  category: string | null;
  duration_minutes: number | null;
  is_published: boolean;
};

type Module = { id: string; title: string; position: number };
type Lesson = {
  id: string;
  module_id: string;
  title: string;
  content: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  position: number;
  is_free_preview: boolean;
};

const AdminCourseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [openModules, setOpenModules] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    const { data: c } = await supabase.from("courses").select("*").eq("id", id).single();
    setCourse(c);
    const { data: m } = await supabase.from("modules").select("*").eq("course_id", id).order("position");
    setModules(m ?? []);
    if (m && m.length) {
      const { data: l } = await supabase
        .from("lessons")
        .select("*")
        .in("module_id", m.map((x) => x.id))
        .order("position");
      const grouped: Record<string, Lesson[]> = {};
      (l ?? []).forEach((ls) => {
        (grouped[ls.module_id] ||= []).push(ls);
      });
      setLessons(grouped);
      setOpenModules(Object.fromEntries(m.map((mod) => [mod.id, true])));
    }
  };

  useEffect(() => {
    loadAll();
  }, [id]);

  const saveCourse = async () => {
    if (!course) return;
    setSaving(true);
    const { error } = await supabase
      .from("courses")
      .update({
        title: course.title,
        slug: course.slug,
        subtitle: course.subtitle,
        description: course.description,
        cover_image_url: course.cover_image_url,
        instructor_name: course.instructor_name,
        price_idr: course.price_idr,
        level: course.level,
        category: course.category,
        duration_minutes: course.duration_minutes,
        is_published: course.is_published,
      })
      .eq("id", course.id);
    setSaving(false);
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else toast({ title: "Course saved" });
  };

  const addModule = async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("modules")
      .insert({ course_id: id, title: "New Module", position: modules.length })
      .select()
      .single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setModules([...modules, data]);
    setOpenModules({ ...openModules, [data.id]: true });
  };

  const updateModule = async (m: Module) => {
    await supabase.from("modules").update({ title: m.title, position: m.position }).eq("id", m.id);
  };

  const deleteModule = async (mid: string) => {
    if (!confirm("Delete this module and its lessons?")) return;
    await supabase.from("modules").delete().eq("id", mid);
    setModules(modules.filter((m) => m.id !== mid));
  };

  const addLesson = async (moduleId: string) => {
    const existing = lessons[moduleId] ?? [];
    const { data, error } = await supabase
      .from("lessons")
      .insert({ module_id: moduleId, title: "New Lesson", position: existing.length })
      .select()
      .single();
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setLessons({ ...lessons, [moduleId]: [...existing, data] });
  };

  const updateLesson = async (l: Lesson) => {
    await supabase
      .from("lessons")
      .update({
        title: l.title,
        content: l.content,
        video_url: l.video_url,
        duration_minutes: l.duration_minutes,
        is_free_preview: l.is_free_preview,
        position: l.position,
      })
      .eq("id", l.id);
  };

  const deleteLesson = async (moduleId: string, lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    await supabase.from("lessons").delete().eq("id", lessonId);
    setLessons({ ...lessons, [moduleId]: lessons[moduleId].filter((l) => l.id !== lessonId) });
  };

  if (!course) return <div className="p-10 text-muted-foreground">Loading...</div>;

  return (
    <div className="p-10 max-w-5xl">
      <Link to="/admin/courses" className="inline-flex items-center gap-2 text-[11px] tracking-editorial uppercase text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft size={13} /> Back to Courses
      </Link>

      <div className="flex items-start justify-between gap-6 mb-8">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Edit Course</p>
          <h1 className="text-3xl">{course.title || "Untitled"}</h1>
        </div>
        <Button onClick={saveCourse} disabled={saving} className="rounded-none">
          {saving ? "Saving..." : "Save Course"}
        </Button>
      </div>

      {/* Course details */}
      <div className="border border-border/50 p-6 mb-10 grid grid-cols-2 gap-5">
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Title</Label>
          <Input value={course.title} onChange={(e) => setCourse({ ...course, title: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Slug</Label>
          <Input value={course.slug} onChange={(e) => setCourse({ ...course, slug: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Category</Label>
          <Input value={course.category ?? ""} onChange={(e) => setCourse({ ...course, category: e.target.value })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Subtitle</Label>
          <Input value={course.subtitle ?? ""} onChange={(e) => setCourse({ ...course, subtitle: e.target.value })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Description</Label>
          <Textarea rows={4} value={course.description ?? ""} onChange={(e) => setCourse({ ...course, description: e.target.value })} className="mt-1.5" />
        </div>
        <div className="col-span-2">
          <Label className="text-[10px] tracking-editorial uppercase">Cover Image URL</Label>
          <Input value={course.cover_image_url ?? ""} onChange={(e) => setCourse({ ...course, cover_image_url: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Instructor</Label>
          <Input value={course.instructor_name ?? ""} onChange={(e) => setCourse({ ...course, instructor_name: e.target.value })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Level</Label>
          <Input value={course.level ?? ""} onChange={(e) => setCourse({ ...course, level: e.target.value })} className="mt-1.5" placeholder="Pemula / Menengah / Lanjutan" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Price (IDR)</Label>
          <Input type="number" value={course.price_idr} onChange={(e) => setCourse({ ...course, price_idr: Number(e.target.value) || 0 })} className="mt-1.5" />
        </div>
        <div>
          <Label className="text-[10px] tracking-editorial uppercase">Duration (min)</Label>
          <Input type="number" value={course.duration_minutes ?? 0} onChange={(e) => setCourse({ ...course, duration_minutes: Number(e.target.value) || null })} className="mt-1.5" />
        </div>
        <div className="col-span-2 flex items-center gap-3 pt-2">
          <Switch checked={course.is_published} onCheckedChange={(v) => setCourse({ ...course, is_published: v })} />
          <Label className="text-[11px] tracking-editorial uppercase">Published</Label>
        </div>
      </div>

      {/* Curriculum */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl">Curriculum</h2>
        <Button onClick={addModule} variant="outline" className="rounded-none gap-2" size="sm">
          <Plus size={14} /> Add Module
        </Button>
      </div>

      {modules.length === 0 && (
        <div className="border border-dashed border-border/50 p-10 text-center text-muted-foreground text-sm">
          No modules yet. Add one to begin.
        </div>
      )}

      <div className="space-y-3">
        {modules.map((mod, i) => (
          <div key={mod.id} className="border border-border/50">
            <div className="flex items-center gap-2 p-3 bg-foreground/[0.02]">
              <button onClick={() => setOpenModules({ ...openModules, [mod.id]: !openModules[mod.id] })}>
                {openModules[mod.id] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
              <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">M{i + 1}</span>
              <Input
                value={mod.title}
                onChange={(e) => setModules(modules.map((m) => (m.id === mod.id ? { ...m, title: e.target.value } : m)))}
                onBlur={() => updateModule(mod)}
                className="border-0 bg-transparent focus-visible:ring-0 px-2 h-8 flex-1"
              />
              <Button size="sm" variant="ghost" onClick={() => deleteModule(mod.id)}>
                <Trash2 size={14} />
              </Button>
            </div>

            {openModules[mod.id] && (
              <div className="p-4 space-y-3 border-t border-border/50">
                {(lessons[mod.id] ?? []).map((l, li) => (
                  <div key={l.id} className="border border-border/50 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tracking-editorial uppercase text-muted-foreground">L{li + 1}</span>
                      <Input
                        value={l.title}
                        onChange={(e) =>
                          setLessons({
                            ...lessons,
                            [mod.id]: lessons[mod.id].map((x) => (x.id === l.id ? { ...x, title: e.target.value } : x)),
                          })
                        }
                        onBlur={() => updateLesson(l)}
                        className="h-8 flex-1"
                      />
                      <Button size="sm" variant="ghost" onClick={() => deleteLesson(mod.id, l.id)}>
                        <Trash2 size={13} />
                      </Button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Video URL (YouTube, Vimeo, mp4...)"
                        value={l.video_url ?? ""}
                        onChange={(e) =>
                          setLessons({
                            ...lessons,
                            [mod.id]: lessons[mod.id].map((x) => (x.id === l.id ? { ...x, video_url: e.target.value } : x)),
                          })
                        }
                        onBlur={() => updateLesson(l)}
                        className="h-8 col-span-2 text-xs"
                      />
                      <Input
                        type="number"
                        placeholder="Duration (min)"
                        value={l.duration_minutes ?? ""}
                        onChange={(e) =>
                          setLessons({
                            ...lessons,
                            [mod.id]: lessons[mod.id].map((x) =>
                              x.id === l.id ? { ...x, duration_minutes: Number(e.target.value) || null } : x
                            ),
                          })
                        }
                        onBlur={() => updateLesson(l)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <Textarea
                      placeholder="Lesson content / notes (markdown supported in player)"
                      rows={2}
                      value={l.content ?? ""}
                      onChange={(e) =>
                        setLessons({
                          ...lessons,
                          [mod.id]: lessons[mod.id].map((x) => (x.id === l.id ? { ...x, content: e.target.value } : x)),
                        })
                      }
                      onBlur={() => updateLesson(l)}
                      className="text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={l.is_free_preview}
                        onCheckedChange={(v) => {
                          const updated = { ...l, is_free_preview: v };
                          setLessons({
                            ...lessons,
                            [mod.id]: lessons[mod.id].map((x) => (x.id === l.id ? updated : x)),
                          });
                          updateLesson(updated);
                        }}
                      />
                      <Label className="text-[10px] tracking-editorial uppercase text-muted-foreground">Free preview</Label>
                    </div>
                  </div>
                ))}
                <Button onClick={() => addLesson(mod.id)} variant="ghost" size="sm" className="gap-2">
                  <Plus size={13} /> Add Lesson
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCourseEdit;
