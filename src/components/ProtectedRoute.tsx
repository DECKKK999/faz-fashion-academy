import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm tracking-editorial uppercase">Memuat...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/masuk" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
