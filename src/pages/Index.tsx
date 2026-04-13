import HeroSection from "@/components/HeroSection";
import ChatMockup from "@/components/ChatMockup";
import PricingSection from "@/components/PricingSection";
import HowItWorks from "@/components/HowItWorks";
import TestimonialsSection from "@/components/TestimonialsSection";
import FAQSection from "@/components/FAQSection";
import ContactSection from "@/components/ContactSection";
import FooterCTA from "@/components/FooterCTA";

// 🔥 ADD THIS
import SetupForm from "@/components/SetupForm";

const Index = () => (
  <div className="min-h-screen">
    <HeroSection />
    <ChatMockup />
    <PricingSection />
    <HowItWorks />
    <TestimonialsSection />
    <FAQSection />

    {/* 🔥 THIS FIXES EVERYTHING */}
    <section id="setup" className="py-20">
      <SetupForm />
    </section>

    <ContactSection />
    <FooterCTA />
  </div>
);

export default Index;