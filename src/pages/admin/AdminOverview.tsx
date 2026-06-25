import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, BookMarked, CalendarDays, CreditCard, Users, GraduationCap, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

type Stats = {
  courses: number;
  ebooks: number;
  events: number;
  enrollments: number;
  students: number;
  orders_pending: number;
};

const AdminOverview = () => {
  const [stats, setStats] = useState<Stats>({ courses: 0, ebooks: 0, events: 0, enrollments: 0, students: 0, orders_pending: 0 });

  useEffect(() => {
    api.get<Stats>("/stats").then(setStats).catch(() => {});
  }, []);

  const cards = [
    { label: "Courses", value: stats.courses, icon: BookOpen, to: "/admin/courses" },
    { label: "E-Books", value: stats.ebooks, icon: BookMarked, to: "/admin/ebooks" },
    { label: "Events", value: stats.events, icon: CalendarDays, to: "/admin/events" },
    { label: "Users", value: stats.students, icon: Users, to: "/admin/users" },
    { label: "Enrollments", value: stats.enrollments, icon: GraduationCap, to: "/admin/courses" },
  ];

  return (
    <div className="p-10 max-w-5xl">
      <div className="mb-10">
        <p className="text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2">Admin</p>
        <h1 className="text-3xl">Overview</h1>
        <p className="text-muted-foreground text-sm mt-2">Kelola seluruh konten dan pengguna FAZ Academy.</p>
      </div>

      {stats.orders_pending > 0 && (
        <Link to="/admin/orders" className="flex items-center justify-between border border-amber-500/40 bg-amber-500/10 rounded-lg p-5 mb-6 hover:bg-amber-500/15 transition-colors">
          <div className="flex items-center gap-3">
            <CreditCard size={20} className="text-amber-600" />
            <div>
              <p className="text-sm font-medium text-foreground">{stats.orders_pending} pembayaran menunggu verifikasi</p>
              <p className="text-xs text-muted-foreground">Klik untuk memproses sekarang.</p>
            </div>
          </div>
          <ArrowRight size={16} className="text-amber-600" />
        </Link>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="group border border-border/50 p-6 hover:border-foreground/30 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <c.icon size={18} className="text-muted-foreground" />
              <ArrowRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
            <p className="text-3xl mb-1">{c.value}</p>
            <p className="text-[11px] tracking-editorial uppercase text-muted-foreground">{c.label}</p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default AdminOverview;
