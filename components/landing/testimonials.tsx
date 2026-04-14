import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Social Media Manager",
    content: "PostGuru completely changed how our agency works. We can manage 15 clients in the time it used to take to manage 3.",
    initials: "SJ"
  },
  {
    name: "Marcus Avery",
    role: "Content Creator",
    content: "The AI suggestions are scarily good. It somehow knows exactly what my audience wants to engage with.",
    initials: "MA"
  },
  {
    name: "Elena Rodriguez",
    role: "Startup Founder",
    content: "As a solo founder, I don't have time for social media. PostGuru basically acts as my full-time marketing manager.",
    initials: "ER"
  }
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 bg-card/40">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Loved by Creators & Brands</h2>
          <p className="text-lg text-muted-foreground">
            Don't just take our word for it. Here's what our early adopters are saying.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((test, i) => (
            <Card key={i} className="bg-background border-border/50 text-card-foreground">
              <CardHeader className="flex flex-row items-center gap-4">
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">{test.initials}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-bold">{test.name}</h4>
                  <p className="text-sm text-muted-foreground font-sans">{test.role}</p>
                </div>
              </CardHeader>
              <CardContent>
                <p className="italic text-foreground/80 font-sans">"{test.content}"</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
