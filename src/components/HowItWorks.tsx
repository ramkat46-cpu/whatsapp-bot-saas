import { MessageSquare, Bot, Bell } from "lucide-react";

const steps = [
  { icon: MessageSquare, title: "Customer Messages You", desc: "They send a WhatsApp message to your number" },
  { icon: Bot, title: "Bot Handles Booking", desc: "Automated replies guide them through the process" },
  { icon: Bell, title: "You Get Notified", desc: "Receive instant notifications for every booking" },
];

const HowItWorks = () => (
  <section className="py-16 px-4 md:py-24">
    <div className="max-w-5xl mx-auto text-center">
      <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-12">How It Works</h2>
      <div className="grid md:grid-cols-3 gap-8">
        {steps.map((step, i) => (
          <div key={step.title} className="relative">
            {i < steps.length - 1 && (
              <div className="hidden md:block absolute top-10 left-[60%] w-[80%] h-0.5 bg-border" />
            )}
            <div className="w-20 h-20 rounded-2xl bg-secondary text-secondary-foreground flex items-center justify-center mx-auto mb-4">
              <step.icon className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
            <p className="text-muted-foreground text-sm">{step.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default HowItWorks;
