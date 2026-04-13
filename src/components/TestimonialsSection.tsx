import { Quote } from "lucide-react";

const testimonials = [
  { quote: "My bookings doubled in a week!", author: "Thabo's Barbershop", location: "Soweto" },
  { quote: "No more missed messages, everything is sorted.", author: "Nail Studio SA", location: "Cape Town" },
];

const TestimonialsSection = () => (
  <section className="py-16 px-4 md:py-24 bg-muted">
    <div className="max-w-4xl mx-auto text-center">
      <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-12">What Our Clients Say</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {testimonials.map((t) => (
          <div key={t.author} className="bg-card rounded-2xl p-6 text-left shadow-sm border border-border">
            <Quote className="w-8 h-8 text-primary/30 mb-3" />
            <p className="text-lg text-foreground font-medium mb-4">"{t.quote}"</p>
            <p className="text-sm font-semibold text-primary">{t.author}</p>
            <p className="text-xs text-muted-foreground">{t.location}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default TestimonialsSection;
