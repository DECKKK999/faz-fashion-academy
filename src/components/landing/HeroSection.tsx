import heroAsset from "@/assets/hero-faz.png.asset.json";
const heroImg = heroAsset.url;

const HeroSection = () => {
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
