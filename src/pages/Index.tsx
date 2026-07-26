import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import PromoSection from "@/components/landing/PromoSection";
import CoursesSection from "@/components/landing/CoursesSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import PromoPopup from "@/components/landing/PromoPopup";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <PromoPopup />
      <Navbar />
      <HeroSection />
      <PromoSection />
      <CoursesSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
