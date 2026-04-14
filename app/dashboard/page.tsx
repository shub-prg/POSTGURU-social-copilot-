import { DashboardHeader } from "@/components/dashboard-header";
import { 
  Instagram, 
  Twitter, 
  Linkedin, 
  Youtube, 
  Smartphone, 
  CheckCircle2, 
  Clock, 
  ChevronRight 
} from "lucide-react";

const stats = [
  { label: "Total Posts", value: "142", change: "↑ 12% this month", color: "text-green-500" },
  { label: "Scheduled", value: "8", change: "↑ 3 new today", color: "text-green-500" },
  { label: "Auto-Replies Sent", value: "1,204", change: "↑ 28% this week", color: "text-green-500" },
  { label: "Connected Accounts", value: "5", change: "3 platforms active", color: "text-[#a78bfa]" },
];

const platforms = [
  { name: "Instagram", icon: Instagram, color: "text-pink-500", active: true },
  { name: "Twitter/X", icon: Twitter, color: "text-blue-400", active: true },
  { name: "LinkedIn", icon: Linkedin, color: "text-blue-600", active: true },
  { name: "YouTube", icon: Youtube, color: "text-red-500", active: false },
];

export default function DashboardPage() {
  return (
    <div className="flex-1 overflow-y-auto bg-background/50">
      <DashboardHeader title="Dashboard" />
      
      <div className="p-7">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group">
              <div className="text-sm font-medium text-muted mb-3 group-hover:text-primary transition-colors">{stat.label}</div>
              <div className="text-3xl font-extrabold tracking-tight mb-2 text-foreground">{stat.value}</div>
              <div className={`text-sm font-medium ${stat.color}`}>{stat.change}</div>
            </div>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduled Posts */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Upcoming Scheduled Posts</h2>
              <button className="text-sm font-semibold text-secondary hover:underline">View All</button>
            </div>
            
            <div className="space-y-2">
              {[
                { title: "Product launch announcement 🚀", time: "Tomorrow, 9:00 AM", platforms: ["IG", "TW", "LI"] },
                { title: "Weekly tips thread", time: "Wed, 2:00 PM", platforms: ["TW", "FB"] },
                { title: "Behind the scenes video", time: "Fri, 6:00 PM", platforms: ["YT", "TK"] },
              ].map((post, i) => (
                <div key={i} className="flex items-center gap-4 py-4 border-b border-border last:border-0 hover:bg-accent/5 px-3 rounded-xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg shrink-0 flex items-center justify-center border border-accent/20">
                    <Smartphone className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold mb-1 truncate text-foreground group-hover:text-primary transition-all">{post.title}</div>
                    <div className="text-sm text-muted flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      {post.time}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {post.platforms.map((p, j) => (
                      <span key={j} className="bg-accent/10 text-muted rounded-md px-2 py-1 text-[11px] uppercase font-black tracking-tighter border border-accent/20">{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Accounts Section */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6 text-foreground">Connected Accounts</h2>
            <div className="space-y-3">
              {platforms.map((platform, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 bg-accent/5 border border-border/50 rounded-xl hover:border-secondary/50 transition-all cursor-pointer group">
                  <div className={`w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 transition-all group-hover:scale-110 ${platform.color}`}>
                    <platform.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-[15px] font-bold text-foreground">{platform.name}</div>
                  <div className={`w-2.5 h-2.5 rounded-full ${platform.active ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-red-500 opacity-50'}`} />
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all active:scale-95">
              + Connect New Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}