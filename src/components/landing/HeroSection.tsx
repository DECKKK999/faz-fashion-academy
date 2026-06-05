import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import heroAsset from "@/assets/hero-faz.png.asset.json";
const heroImg = heroAsset.url;
import fazLogo from "@/assets/faz-logo.png";

const HeroSection = () => {
  const { user } = useAuth();
  return (
    <section className="relative min-h-screen flex flex-col justify-between overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="FAZ Academy Editorial"
          className="w-full h-full object-cover"
          width={1920}
          height={1080}
        />
      </div>
    </section>
  );
};

export default HeroSection;
