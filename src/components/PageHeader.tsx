import { ReactNode } from "react";
import Kicker from "@/components/landing/Kicker";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  kicker?: string;
  title: string;
  subtitle?: ReactNode;
  className?: string;
  align?: "left" | "center";
}

/**
 * Consistent header for the app's "utility" pages (Kelas, Cart, Wishlist,
 * MyOrders, Certificates, Akun, certificate verification…) — these used to
 * each hand-roll their own H1 at a different size/weight/style. One shared
 * scale here instead.
 */
const PageHeader = ({ kicker, title, subtitle, className, align = "left" }: PageHeaderProps) => (
  <div className={cn("mb-10", align === "center" && "text-center", className)}>
    {kicker && <Kicker className={cn("mb-4", align === "center" && "justify-center")}>{kicker}</Kicker>}
    <h1 className="font-serif text-3xl md:text-5xl text-foreground">{title}</h1>
    {subtitle && (
      <p className={cn("text-muted-foreground mt-4 max-w-xl leading-relaxed", align === "center" && "mx-auto")}>
        {subtitle}
      </p>
    )}
  </div>
);

export default PageHeader;
