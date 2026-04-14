import { Badge } from "@/components/ui/badge";

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <Badge variant="secondary" className="mb-4">Process</Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">How PostGuru Works</h2>
          <p className="text-lg text-muted-foreground">
            Three simple steps to put your social media growth on autopilot.
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12 md:gap-8 relative">
          {/* Connector Line */}
          <div className="hidden md:block absolute top-[50px] left-[15%] right-[15%] h-[2px] bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 z-0"></div>

          <div className="flex flex-col items-center text-center relative z-10 group">
            <div className="w-24 h-24 rounded-full bg-background border-4 border-primary/20 text-3xl font-black flex items-center justify-center mb-6 shadow-xl transition-all group-hover:scale-110 group-hover:border-primary">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">1</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Connect Platforms</h3>
            <p className="text-muted-foreground text-sm font-sans">
              Link your X, LinkedIn, Facebook, and Instagram accounts quickly and securely.
            </p>
          </div>

          <div className="flex flex-col items-center text-center relative z-10 group">
            <div className="w-24 h-24 rounded-full bg-background border-4 border-primary/20 text-3xl font-black flex items-center justify-center mb-6 shadow-xl transition-all group-hover:scale-110 group-hover:border-primary">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">2</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Generate Content</h3>
            <p className="text-muted-foreground text-sm font-sans">
              Enter your ideas or keywords, and let our AI generate the perfect content for each specific platform.
            </p>
          </div>

          <div className="flex flex-col items-center text-center relative z-10 group">
            <div className="w-24 h-24 rounded-full bg-background border-4 border-primary/20 text-3xl font-black flex items-center justify-center mb-6 shadow-xl transition-all group-hover:scale-110 group-hover:border-primary">
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-primary to-secondary">3</span>
            </div>
            <h3 className="text-xl font-bold mb-3">Review & Schedule</h3>
            <p className="text-muted-foreground text-sm font-sans">
              Tweak our AI suggestions, and pick optimal scheduling times. We'll handle the actual posting!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
