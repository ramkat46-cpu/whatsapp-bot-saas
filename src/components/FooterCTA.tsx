import { MessageCircle } from "lucide-react";

const FooterCTA = () => (
  <section className="py-20 px-4 text-center" style={{ background: "var(--hero-gradient)" }}>
    <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">Get Your Bot Today</h2>
    <p className="text-primary-foreground/80 text-lg mb-8">No stress. More bookings. Sorted.</p>
    <a
      href="#contact"
      className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-8 py-4 rounded-full text-lg hover:scale-105 transition-transform shadow-lg"
    >
      <MessageCircle className="w-5 h-5" />
      Start Now
    </a>
    <p className="text-primary-foreground/50 text-sm mt-8">© 2026 WhatsApp Booking Bot SA</p>
  </section>
);

export default FooterCTA;
