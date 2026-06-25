import { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError, type AppRole, type AuthUser, type Profile, type Session } from "@/lib/api";

type AuthContextType = {
  user: AuthUser | null;
  profile: Profile;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  roles: [],
  loading: true,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refresh: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const applySession = (s: Session) => {
    setUser(s.user);
    setProfile(s.profile);
    setRoles(s.roles);
  };

  const clearSession = () => {
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const refresh = async () => {
    try {
      const s = await api.get<Session>("/auth/me");
      applySession(s);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        clearSession();
      }
    }
  };

  useEffect(() => {
    (async () => {
      await refresh();
      setLoading(false);
    })();
  }, []);

  const signIn = async (email: string, password: string) => {
    const s = await api.post<Session>("/auth/login", { email, password });
    applySession(s);
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const s = await api.post<Session>("/auth/register", {
      email,
      password,
      full_name: fullName,
    });
    applySession(s);
  };

  const signOut = async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, roles, loading, signIn, signUp, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
};
