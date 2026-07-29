import { ReactNode } from "react";
import Navbar from "@/components/Navbar";
import GrainOverlay from "@/components/landing/GrainOverlay";
import Kicker from "@/components/landing/Kicker";

interface AuthShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

/**
 * Shared chrome for Daftar/Masuk/LupaPassword/ResetPassword/VerifikasiEmail —
 * these five pages were identical shells (Navbar + centered card) duplicated
 * five times. Consolidated once so the editorial dark treatment (grain,
 * glow, glass card) only needs to be tuned in one place.
 */
const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
  <div className="min-h-screen bg-background relative overflow-hidden">
    <GrainOverlay />
    <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[440px] h-[440px] rounded-full blur-[110px] opacity-25 pointer-events-none bg-primary" />
    <Navbar />
    <div className="relative pt-28 pb-16 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Kicker className="justify-center mb-3">FAZ Academy</Kicker>
          <h1 className="font-serif text-2xl md:text-3xl text-foreground">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm mt-2">{subtitle}</p>}
        </div>
        <div className="glass-panel rounded-2xl p-8 space-y-5 shadow-lg">{children}</div>
      </div>
    </div>
  </div>
);

export default AuthShell;
