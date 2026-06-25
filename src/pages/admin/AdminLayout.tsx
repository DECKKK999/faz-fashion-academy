import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { BookOpen, BookMarked, CalendarDays, CreditCard, LayoutDashboard, LogOut, Settings, Users, ArrowLeft, BarChart3, Ticket, Star, Award, Mail, Plug } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/reports", label: "Reports", icon: BarChart3 },
  { to: "/admin/orders", label: "Pembayaran", icon: CreditCard },
  { to: "/admin/coupons", label: "Kupon", icon: Ticket },
  { to: "/admin/courses", label: "Courses", icon: BookOpen },
  { to: "/admin/ebooks", label: "E-Books", icon: BookMarked },
  { to: "/admin/events", label: "Events", icon: CalendarDays },
  { to: "/admin/reviews", label: "Ulasan", icon: Star },
  { to: "/admin/certificates", label: "Sertifikat", icon: Award },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/email-logs", label: "Email Log", icon: Mail },
  { to: "/admin/payment-gateway", label: "Gateway", icon: Plug },
  { to: "/admin/settings", label: "Pengaturan", icon: Settings },
];

const AdminLayout = () => {
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="w-60 border-r border-border/50 flex flex-col">
        <div className="h-14 px-5 flex items-center border-b border-border/50">
          <Link to="/" className="text-[11px] tracking-[0.3em] uppercase text-foreground">
            FAZ Admin
          </Link>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 text-[13px] tracking-editorial uppercase font-light rounded transition-colors ${
                  isActive
                    ? "bg-foreground/10 text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                }`
              }
            >
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-border/50 space-y-1">
          <p className="px-3 text-[10px] text-muted-foreground truncate">{user?.email}</p>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-[13px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={15} />
            Back to Site
          </Link>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2 text-[13px] tracking-editorial uppercase font-light text-muted-foreground hover:text-foreground"
          >
            <LogOut size={15} />
            Sign Out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
