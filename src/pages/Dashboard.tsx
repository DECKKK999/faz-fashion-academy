import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { BookOpen, BookMarked, Video, Award, Receipt, User, LogOut, ArrowLeft, ArrowRight, Download, Ticket, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import GrainOverlay from "@/components/landing/GrainOverlay";
import fazWordmark from "@/assets/faz-wordmark.png";
import { useAuth } from "@/contexts/AuthContext";
import { api, type Enrollment, type Library } from "@/lib/api";
import { formatDuration } from "@/lib/format";

const Dashboard = () => {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [library, setLibrary] = useState<Library>({ ebooks: [], tickets: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Enrollment[]>("/enrollments").then(setEnrollments).catch(() => {}),
      api.get<Library>("/library").then(setLibrary).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Fashionista";

  const stats = [
    { label: "Kelas Saya", value: enrollments.length, icon: Video, to: "/dashboard" },
    { label: "E-Book Saya", value: library.ebooks.length, icon: BookMarked, to: "/dashboard" },
    { label: "Tiket Event", value: library.tickets.length, icon: Ticket, to: "/dashboard" },
    { label: "Sertifikat", value: enrollments.filter((e) => e.completed_at).length, icon: Award, to: "/sertifikat" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <GrainOverlay />
      <div className="glass-panel border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 grid grid-cols-3 items-center h-14">
          <Link to="/" className="justify-self-start flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft size={15} /> <span className="hidden sm:inline">Back To Home</span>
          </Link>
          <Link to="/" className="justify-self-center flex items-center" aria-label="FAZ Academy — Beranda">
            <img src={fazWordmark} alt="FAZ Academy" className="h-6 w-auto wordmark-adaptive" />
          </Link>
          <div className="justify-self-end flex items-center gap-4">
            <Link to="/pesanan" className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1.5">
              <Receipt size={17} /> <span className="hidden sm:inline">Pesanan</span>
            </Link>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center"><User size={16} className="text-foreground" /></div>
              <span className="text-sm text-muted-foreground hidden sm:block">{displayName}</span>
            </div>
            <button onClick={handleSignOut} className="text-muted-foreground hover:text-foreground transition-colors"><LogOut size={18} /></button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Selamat Datang, {displayName}! 👋</h1>
          <p className="text-muted-foreground mt-1">Lanjutkan belajar dan raih tujuanmu di dunia fashion.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {stats.map((stat) => (
            <Link to={stat.to} key={stat.label} className="glass-panel rounded-2xl p-5 hover:-translate-y-1 transition-transform">
              <stat.icon size={20} className="text-accent mb-3" />
              <p className="font-serif text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </Link>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl font-semibold text-foreground">Kelas Saya</h2>
          <Button variant="ghost" size="sm" asChild><Link to="/kelas">Jelajahi Kelas</Link></Button>
        </div>

        {loading ? (
          <p className="text-muted-foreground text-sm">Memuat...</p>
        ) : enrollments.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-12 text-center">
            <BookOpen size={28} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground mb-4">Kamu belum memiliki kelas.</p>
            <Button asChild><Link to="/kelas">Lihat Katalog Kelas</Link></Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrollments.map((e) => (
              <div key={e.id} className="bg-card border border-border rounded-lg overflow-hidden group hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300">
                <div className="aspect-[16/9] overflow-hidden bg-muted">
                  <img src={e.course.cover_image_url ?? ""} alt={e.course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-5">
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">{e.course.category}</p>
                  <h3 className="font-serif text-lg font-semibold text-foreground mb-2">{e.course.title}</h3>
                  <p className="text-xs text-muted-foreground mb-4">
                    {e.course.instructor_name ? `oleh ${e.course.instructor_name}` : ""}
                    {e.course.duration_minutes ? ` · ${formatDuration(e.course.duration_minutes)}` : ""}
                  </p>
                  <Button size="sm" variant="gradient" className="w-full rounded-full gap-2" asChild>
                    <Link to={`/belajar/${e.course.slug}`}>Mulai Belajar <ArrowRight size={14} /></Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* E-Book Saya */}
        {library.ebooks.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">E-Book Saya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {library.ebooks.map((g) => (
                <div key={g.id} className="bg-card border border-border rounded-lg p-4 flex gap-4 items-center">
                  <img src={g.ebook.cover_image_url ?? ""} alt={g.ebook.title} className="w-14 h-20 object-cover rounded bg-muted" />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{g.ebook.title}</h3>
                    <p className="text-xs text-muted-foreground mb-2">{g.ebook.author}</p>
                    <Button size="sm" variant="outline" className="gap-2" asChild>
                      <a href={`/api/ebooks/${g.ebook.id}/download`} target="_blank" rel="noreferrer"><Download size={13} /> Unduh PDF</a>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tiket Event Saya */}
        {library.tickets.length > 0 && (
          <div className="mt-12">
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Tiket Event Saya</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {library.tickets.map((t) => (
                <div key={t.id} className="bg-card border border-border rounded-lg p-4">
                  <p className="text-[11px] tracking-editorial uppercase text-muted-foreground mb-1">{t.status}</p>
                  <h3 className="font-medium text-foreground text-sm mb-1">{t.event.title}</h3>
                  {t.event.date_label && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3"><Calendar size={12} /> {t.event.date_label}</p>
                  )}
                  <div className="border border-dashed border-border rounded px-3 py-2 text-center">
                    <p className="text-[11px] text-muted-foreground">Kode Tiket</p>
                    <p className="font-mono text-sm tracking-wider text-foreground">{t.ticket_code}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
