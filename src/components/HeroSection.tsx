import { MessageCircle } from "lucide-react";

const HeroSection = () => (
  <section
    className="relative overflow-hidden py-20 px-4 md:py-32"
    style={{ background: "var(--hero-gradient)" }}
  >
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-10 left-10 w-72 h-72 bg-accent rounded-full blur-3xl" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary rounded-full blur-3xl" />
    </div>

    <div className="relative max-w-4xl mx-auto text-center">
      <div className="inline-flex items-center gap-2 bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 rounded-full px-4 py-2 mb-6 text-primary-foreground text-sm animate-fade-up">
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        Built for South African businesses
      </div>

      <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-primary-foreground leading-tight mb-6 animate-fade-up animate-fade-up-delay-1">
        Never Miss a Booking Again — Your WhatsApp Does the Work
      </h1>

      <p className="text-primary-foreground/80 text-lg md:text-xl max-w-2xl mx-auto mb-8 animate-fade-up animate-fade-up-delay-2">
        More bookings, less stress, fully automated.
      </p>

      {/* ✅ CLEAN BUTTON */}
      <a
        href="#setup"
        className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-8 py-4 rounded-full text-lg hover:scale-105 transition-transform shadow-lg animate-fade-up animate-fade-up-delay-3"
      >
        <MessageCircle className="w-5 h-5" />
        Get Your Bot Today
      </a>
    </div>
  </section>
);

export default HeroSection;