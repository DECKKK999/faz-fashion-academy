import Navbar from "@/components/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ReviewsCarousel from "@/components/landing/ReviewsCarousel";
import PromoSection from "@/components/landing/PromoSection";
import CoursesSection from "@/components/landing/CoursesSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import CTASection from "@/components/landing/CTASection";
import PromoPopup from "@/components/landing/PromoPopup";
import GrainOverlay from "@/components/landing/GrainOverlay";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen relative">
      <GrainOverlay />
      <PromoPopup />
      <Navbar />
      <HeroSection />
      <ReviewsCarousel />
      <PromoSection />
      <CoursesSection />
      <FeaturesSection />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
