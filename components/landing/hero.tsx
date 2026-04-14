import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Twitter, Linkedin, Facebook, Instagram, Youtube, MessageCircle, Video, Image as ImageIcon } from "lucide-react";
import { auth } from "@clerk/nextjs/server";

export async function Hero() {
  const { userId } = await auth();
  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-background">
      {/* Background Glows */}
      <div className="absolute top-0 -translate-y-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
      
      <div className="container px-4 md:px-8 mx-auto relative z-10 flex flex-col items-center text-center">
        
        {/* Floating Icons */}
        {/* Top Left Cluster */}
        <div className="hidden lg:flex absolute top-[15%] left-[8%]" style={{ animation: 'float 6s ease-in-out infinite 0s' }}>
          <div className="bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] p-4 w-14 h-14 rounded-[1.3rem] shadow-2xl flex items-center justify-center text-white">
            <Instagram className="w-7 h-7" />
          </div>
        </div>
        <div className="hidden lg:flex absolute top-[7%] left-[20%]" style={{ animation: 'float 5s ease-in-out infinite 1s' }}>
          <div className="bg-black border border-white/10 dark:border-white/20 p-4 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white">
            <Twitter className="w-5 h-5 fill-current" />
          </div>
        </div>
        {/* Mid Left Cluster */}
        <div className="hidden lg:flex absolute top-[55%] left-[6%]" style={{ animation: 'float 7s ease-in-out infinite 2s' }}>
          <div className="bg-[#FF4500] p-4 w-12 h-12 rounded-2xl shadow-2xl flex items-center justify-center text-white">
            <MessageCircle className="w-6 h-6 fill-current" />
          </div>
        </div>
        {/* Bottom Left Cluster */}
        <div className="hidden lg:flex absolute top-[85%] left-[10%]" style={{ animation: 'float 6.5s ease-in-out infinite 1.5s' }}>
          <div className="bg-[#FF0000] p-4 w-14 h-14 rounded-[1.3rem] shadow-2xl flex items-center justify-center text-white">
            <Youtube className="w-7 h-7 fill-current" />
          </div>
        </div>
        <div className="hidden lg:flex absolute top-[75%] left-[22%]" style={{ animation: 'float 5.5s ease-in-out infinite 0.5s' }}>
          <div className="bg-[#1877F2] p-4 w-14 h-14 rounded-3xl shadow-2xl flex items-center justify-center text-white">
            <Facebook className="w-7 h-7 fill-current" />
          </div>
        </div>
        
        {/* Top Right Cluster */}
        <div className="hidden lg:flex absolute top-[10%] right-[10%]" style={{ animation: 'float 6s ease-in-out infinite 1.2s' }}>
          <div className="bg-[#0a66c2] p-4 w-14 h-14 rounded-2xl shadow-2xl flex items-center justify-center text-white">
            <Linkedin className="w-7 h-7 fill-current" />
          </div>
        </div>
        <div className="hidden lg:flex absolute top-[28%] right-[5%]" style={{ animation: 'float 7s ease-in-out infinite 0.8s' }}>
          <div className="bg-black border border-white/10 dark:border-white/20 p-4 w-11 h-11 rounded-full shadow-2xl flex items-center justify-center text-white">
            <Video className="w-5 h-5 fill-current" />
          </div>
        </div>
        {/* Bottom Right Cluster */}
        <div className="hidden lg:flex absolute top-[78%] right-[22%]" style={{ animation: 'float 5.5s ease-in-out infinite 1.8s' }}>
          <div className="bg-[#111] p-4 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white border border-white/10">
            <span className="font-bold text-lg font-sans">@</span>
          </div>
        </div>
        <div className="hidden lg:flex absolute top-[90%] right-[12%]" style={{ animation: 'float 6.5s ease-in-out infinite 0.3s' }}>
          <div className="bg-[#E60023] p-4 w-12 h-12 rounded-full shadow-2xl flex items-center justify-center text-white">
            <ImageIcon className="w-6 h-6 fill-current" />
          </div>
        </div>

        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary/10 text-secondary hover:bg-secondary/20 mb-6 font-sans">
          <Sparkles className="w-4 h-4 mr-2" />
          The Ultimate Post Scheduler
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl text-balance">
          Schedule Smarter, Grow <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Faster</span> with AI
        </h1>
        
        <p className="text-xl text-muted-foreground mb-10 max-w-2xl text-balance">
          Automate your social media presence. Create, schedule, and optimize your posts across all platforms from one powerful dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-20 w-full sm:w-auto px-4 sm:px-0">
          {userId ? (
            <Button render={<Link href="/dashboard" />} nativeButton={false} size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:scale-105 w-full sm:w-auto">
              Go to Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button render={<Link href="/sign-up" />} nativeButton={false} size="lg" className="h-14 px-8 text-base shadow-lg shadow-primary/25 transition-all hover:scale-105 w-full sm:w-auto">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button render={<Link href="#features" />} nativeButton={false} size="lg" variant="outline" className="h-14 px-8 text-base w-full sm:w-auto">
                Learn More
              </Button>
            </>
          )}
        </div>

        {/* Logo Strip / Marquee */}
        <div className="w-full max-w-5xl border-t border-border/50 pt-10">
          <p className="text-sm text-muted-foreground mb-8 font-medium uppercase tracking-wider">Integrates seamlessly with</p>
          <div className="relative flex overflow-hidden w-full group mask-image-fade">
            <div className="animate-marquee flex flex-row gap-12 sm:gap-24 items-center w-max pl-12 sm:pl-24">
              {/* Repeated twice to look infinite */}
              {[...Array(2)].map((_, i) => (
                <div key={i} className="flex gap-12 sm:gap-24 opacity-70 grayscale hover:grayscale-0 transition-all duration-300 items-center">
                  <div className="text-3xl font-black text-foreground/80 tracking-tighter">X/Twitter</div>
                  <div className="text-3xl font-bold text-foreground/80 font-sans tracking-tight">LinkedIn</div>
                  <div className="text-3xl font-bold text-foreground/80 font-sans tracking-tight text-[#1877F2]">Facebook</div>
                  <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-500 font-sans tracking-tight">Instagram</div>
                  <div className="text-3xl font-bold text-foreground/80 font-sans tracking-tight">TikTok</div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
