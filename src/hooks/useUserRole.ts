import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@/lib/api";

export type { AppRole };

export const useUserRole = () => {
  const { roles, loading } = useAuth();

  const hasRole = (role: AppRole) => roles.includes(role);
  const isAdmin = hasRole("admin");
  const isInstructor = hasRole("instructor");
  const canManage = isAdmin || isInstructor;

  return { roles, loading, hasRole, isAdmin, isInstructor, canManage };
};
