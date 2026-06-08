import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Users, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

const AdminOverview = () => {
  const [stats, setStats] = useState({ courses: 0, enrollments: 0, students: 0 });

  useEffect(() => {
    Promise.all([
      supabase.from("courses").select("*", { count: "exact", head: true }),
      supabase.from("enrollments").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }),
    ]).then(([c, e, p]) => {
      setStats({ courses: c.count ?? 0, enrollments: e.count ?? 0, students: p.count ?? 0 });
    });
  }, []);

  const cards = [
    { label: "Courses", value: stats.courses, icon: BookOpen },
    { label: "Enrollments", value: stats.enrollments, icon: GraduationCap },
    { label: "Users", value: stats.students, icon: Users },
  ];

  return (
    <div className="p-10 max-w-5xl">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
          <h1 className="text-3xl">Overview</h1>
        </div>
        <Button asChild className="rounded-none">
          <Link to="/admin/courses">Manage Courses</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="border border-border/50 p-6">
            <div className="flex items-center justify-between mb-4">
              <c.icon size={18} className="text-muted-foreground" />
            </div>
            <p className="text-3xl mb-1">{c.value}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
