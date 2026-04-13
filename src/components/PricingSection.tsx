import { Check, Star } from "lucide-react";

const plans = [
  { name: "Basic", setup: "R500", monthly: "R99/mo", features: ["Simple booking flow", "Auto-replies", "WhatsApp integration"], popular: false },
  { name: "Standard", setup: "R1,000", monthly: "R199/mo", features: ["Custom messages", "Notifications", "Business hours", "Follow-up messages"], popular: true },
  { name: "Premium", setup: "R1,500", monthly: "R299/mo", features: ["Full automation", "Priority support", "Analytics dashboard", "Multi-staff booking", "Custom integrations"], popular: false },
];

const PricingSection = () => (
  <section className="py-16 px-4 md:py-24 bg-muted" id="pricing">
    <div className="max-w-5xl mx-auto text-center">
      <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">Simple, Transparent Pricing</h2>
      <p className="text-muted-foreground text-lg mb-12">No hidden fees. Cancel anytime.</p>
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative bg-card rounded-2xl p-6 text-left shadow-sm border transition-transform hover:-translate-y-1 ${
              plan.popular ? "border-primary ring-2 ring-primary/20" : "border-border"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                <Star className="w-3 h-3" /> Most Popular
              </div>
            )}
            <h3 className="text-xl font-bold text-foreground mb-1">{plan.name}</h3>
            <p className="text-3xl font-bold text-primary mb-1">{plan.setup}</p>
            <p className="text-muted-foreground text-sm mb-4">setup + {plan.monthly}</p>
            <ul className="space-y-2 mb-6">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="w-4 h-4 text-accent" /> {f}
                </li>
              ))}
            </ul>
            <a
              href="#contact"
              className={`block text-center py-3 rounded-full font-semibold transition-colors ${
                plan.popular
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              Get Started
            </a>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default PricingSection;
