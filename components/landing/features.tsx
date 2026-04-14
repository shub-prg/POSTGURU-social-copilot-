import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { PenTool, CalendarClock, Target, Zap, LayoutDashboard, Share2 } from "lucide-react";

const features = [
  {
    title: "AI-Powered Generation",
    description: "Generate highly engaging post ideas, captions, and images directly from a single prompt.",
    icon: <PenTool className="h-6 w-6 text-primary" />
  },
  {
    title: "Smart Scheduling",
    description: "Schedule posts automatically to push out at the peak viewing times of your audience.",
    icon: <CalendarClock className="h-6 w-6 text-primary" />
  },
  {
    title: "Audience Targeting",
    description: "Understand your audience better with AI analytics and optimize your content strategy.",
    icon: <Target className="h-6 w-6 text-primary" />
  },
  {
    title: "Auto-Publishing",
    description: "Publish your generated posts to X, LinkedIn, Instagram and more completely hands-free.",
    icon: <Zap className="h-6 w-6 text-primary" />
  },
  {
    title: "Unified Dashboard",
    description: "View all your social media posts from multiple platforms managed inside one central hub.",
    icon: <LayoutDashboard className="h-6 w-6 text-primary" />
  },
  {
    title: "Omnichannel Reach",
    description: "Easily distribute and repurpose the same piece of content seamlessly across multiple channels.",
    icon: <Share2 className="h-6 w-6 text-primary" />
  }
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-card/40">
      <div className="container px-4 md:px-8 mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">Powerful Features for Modern Creators</h2>
          <p className="text-lg text-muted-foreground">
            Everything you need to grow your digital presence, powered by state-of-the-art AI.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <Card key={idx} className="transition-all hover:shadow-lg hover:-translate-y-1 bg-card/60 backdrop-blur-sm border-border/60">
              <CardHeader>
                <div className="bg-primary/10 w-12 h-12 rounded-lg flex items-center justify-center mb-4 ring-1 ring-primary/20">
                  {feature.icon}
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-muted-foreground leading-relaxed font-sans">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
