const ChatMockup = () => (
  <section className="py-16 px-4 md:py-24">
    <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
      <div>
        <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-4">
          See It in Action
        </h2>
        <p className="text-muted-foreground text-lg mb-6">
          Your customers message you on WhatsApp — the bot handles everything instantly.
        </p>
        <ul className="space-y-3">
          {["Instant replies 24/7", "Handles bookings automatically", "Sends you notifications"].map((item) => (
            <li key={item} className="flex items-center gap-3 text-foreground">
              <span className="w-6 h-6 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center text-sm font-bold">✓</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="animate-float">
        <div className="bg-chat-bg rounded-2xl p-5 shadow-xl max-w-sm mx-auto border border-border">
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-border">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">WA</div>
            <div>
              <p className="font-semibold text-foreground text-sm">Your Business Bot</p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="bg-chat-user rounded-xl rounded-tl-sm p-3 max-w-[75%] shadow-sm">
              <p className="text-sm text-foreground">Hi</p>
            </div>
            <div className="bg-chat-bot rounded-xl rounded-tr-sm p-3 max-w-[85%] ml-auto shadow-sm">
              <p className="text-sm text-foreground">Welcome 👋</p>
              <p className="text-sm text-foreground mt-1">1️⃣ Book appointment</p>
              <p className="text-sm text-foreground">2️⃣ View prices</p>
              <p className="text-sm text-foreground">3️⃣ Talk to owner</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default ChatMockup;
