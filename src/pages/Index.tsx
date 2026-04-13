import HeroSection from "@/components/HeroSection";
import ChatMockup from "@/components/ChatMockup";
import PricingSection from "@/components/PricingSection";
import HowItWorks from "@/components/HowItWorks";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import FooterCTA from "@/components/FooterCTA";

const Index = () => (
  <div className="min-h-screen">
    <HeroSection />
    <ChatMockup />
    <PricingSection />
    <HowItWorks />
    <TestimonialsSection />
    <FAQSection />
    <ContactSection />
    <FooterCTA />
  </div>
);

export default Index;
