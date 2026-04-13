import { useState } from "react";
import { ChevronDown } from "lucide-react";

const faqs = [
  { q: "Does it work without internet?", a: "No, WhatsApp requires internet, but it uses very little data." },
  { q: "How do I get started?", a: "Click the WhatsApp button and we'll set you up in 24 hours." },
  { q: "Can I customise the messages?", a: "Yes, fully customised to your business." },
];

const FAQSection = () => {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-16 px-4 md:py-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl md:text-4xl font-bold text-foreground text-center mb-12">FAQ</h2>
        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-border rounded-xl overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-foreground hover:bg-muted transition-colors"
              >
                {faq.q}
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
              </button>
              {open === i && (
                <div className="px-4 pb-4 text-muted-foreground text-sm">{faq.a}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
