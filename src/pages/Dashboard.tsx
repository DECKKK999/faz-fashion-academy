import { Link } from "react-router-dom";
import {
  BookOpen, Video, Award, Calendar, TrendingUp, Clock, CheckCircle2,
  BarChart3, ShoppingBag, Bell, User
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const enrolledCourses = [
  { title: "Desain Busana Dasar", progress: 65, totalModules: 12, completedModules: 8, nextLesson: "Teknik Menjahit Dasar" },
  { title: "Fashion Marketing Digital", progress: 30, totalModules: 10, completedModules: 3, nextLesson: "Social Media Strategy" },
  { title: "Fashion Illustration", progress: 90, totalModules: 8, completedModules: 7, nextLesson: "Final Project" },
];

const recentActivity = [
  { text: "Menyelesaikan modul 'Pengantar Pola Dasar'", time: "2 jam lalu", icon: CheckCircle2 },
  { text: "Membeli e-book 'Fashion Trend 2026'", time: "1 hari lalu", icon: ShoppingBag },
  { text: "Mendaftar event 'Fashion Talk #12'", time: "2 hari lalu", icon: Calendar },
  { text: "Mendapatkan sertifikat 'Styling Basics'", time: "1 minggu lalu", icon: Award },
];

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar-like top bar for now */}
      <div className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <span className="font-serif text-2xl font-bold text-gold-gradient">FAZ</span>
            <span className="text-sm text-muted-foreground tracking-widest uppercase">Academy</span>
          </Link>
          <div className="flex items-center gap-4">
            <button className="relative">
              <Bell size={20} className="text-muted-foreground hover:text-foreground transition-colors" />
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
            </button>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <User size={16} className="text-primary-foreground" />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-bold text-foreground">Selamat Datang, Fashionista! 👋</h1>
          <p className="text-muted-foreground mt-1">Lanjutkan belajar dan raih tujuanmu di dunia fashion.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: "Kelas Aktif", value: "3", icon: Video, color: "text-primary" },
            { label: "Jam Belajar", value: "47", icon: Clock, color: "text-gold" },
            { label: "Sertifikat", value: "2", icon: Award, color: "text-green-600" },
            { label: "E-Book", value: "5", icon: BookOpen, color: "text-blue-600" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border rounded-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <stat.icon size={20} className={stat.color} />
                <TrendingUp size={14} className="text-green-500" />
              </div>
              <p className="font-serif text-2xl font-bold text-foreground">{stat.value}</p>
              <p className="text-muted-foreground text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Enrolled courses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-serif text-xl font-semibold text-foreground">Kelas Saya</h2>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/kelas">Lihat Semua</Link>
              </Button>
            </div>
            {enrolledCourses.map((course) => (
              <div key={course.title} className="bg-card border border-border rounded-lg p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-foreground">{course.title}</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Selanjutnya: {course.nextLesson}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2 mb-3" />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {course.completedModules}/{course.totalModules} modul selesai
                  </p>
                  <Button size="sm">Lanjutkan</Button>
                </div>
              </div>
            ))}
          </div>

          {/* Recent activity */}
          <div>
            <h2 className="font-serif text-xl font-semibold text-foreground mb-4">Aktivitas Terbaru</h2>
            <div className="bg-card border border-border rounded-lg p-5 space-y-5">
              {recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <activity.icon size={14} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={18} className="text-primary" />
                <h3 className="font-serif font-semibold text-foreground">Target Mingguan</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-3">5 dari 7 jam belajar tercapai</p>
              <Progress value={71} className="h-2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
