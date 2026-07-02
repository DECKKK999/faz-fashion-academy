import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { canManage, loading: roleLoading } = useUserRole();
  const location = useLocation();

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-editorial uppercase">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/masuk?redirect=${redirect}`} replace />;
  }
  if (!canManage) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-2xl">Akses Ditolak</h1>
        <p className="text-muted-foreground max-w-md">
          Halaman ini hanya untuk admin dan instruktur. Hubungi administrator untuk meminta akses.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
