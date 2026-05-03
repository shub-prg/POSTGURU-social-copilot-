import { DashboardHeader } from "@/components/dashboard-header";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db";
import { 
  users, 
  posts, 
  autoReplyLogs, 
  connectedAccounts, 
  postPlatformResults 
} from "@/db/schema";
import { eq, and, gte, desc, sql } from "drizzle-orm";
import { 
  PlusCircle, 
  Clock, 
  MessageSquare, 
  Globe,
  Plus,
  Smartphone,
  ChevronRight,
  PlusSquare
} from "lucide-react";
import { PLATFORM_CONFIGS } from "@/lib/platforms";
import { HugeiconsIcon } from "@hugeicons/react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  // Get internal user ID
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (!user) return null;

  // 1. Fetch Stats
  const [
    totalPostsResult,
    scheduledPostsCountResult,
    autoRepliesCountResult,
    accountsCountResult
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(posts).where(eq(posts.userId, user.id)),
    db.select({ count: sql<number>`count(*)` }).from(posts).where(and(eq(posts.userId, user.id), eq(posts.status, 'SCHEDULED'))),
    db.select({ count: sql<number>`count(*)` }).from(autoReplyLogs).where(eq(autoReplyLogs.userId, user.id)),
    db.select({ count: sql<number>`count(*)` }).from(connectedAccounts).where(eq(connectedAccounts.userId, user.id)),
  ]);

  const stats = [
    { label: "Total Posts", value: totalPostsResult[0].count.toLocaleString(), icon: PlusSquare, color: "text-blue-500" },
    { label: "Scheduled", value: scheduledPostsCountResult[0].count.toLocaleString(), icon: Clock, color: "text-amber-500" },
    { label: "Auto-Replies", value: autoRepliesCountResult[0].count.toLocaleString(), icon: MessageSquare, color: "text-green-500" },
    { label: "Connected Accounts", value: accountsCountResult[0].count.toLocaleString(), icon: Globe, color: "text-purple-500" },
  ];

  // 2. Fetch Upcoming Scheduled Posts
  const upcomingPosts = await db.query.posts.findMany({
    where: and(
      eq(posts.userId, user.id),
      eq(posts.status, 'SCHEDULED'),
      gte(posts.scheduledAt, new Date())
    ),
    orderBy: [posts.scheduledAt],
    limit: 5,
    with: {
      results: true,
    }
  });

  // 3. Fetch Connected Accounts
  const userAccounts = await db.query.connectedAccounts.findMany({
    where: eq(connectedAccounts.userId, user.id),
    orderBy: [desc(connectedAccounts.createdAt)],
  });

  return (
    <div className="flex-1 overflow-y-auto bg-background/50">
      <DashboardHeader title="Dashboard" />
      
      <div className="p-7">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {stats.map((stat, i) => (
            <div key={i} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all hover:shadow-xl hover:shadow-primary/5 group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">{stat.label}</div>
                <stat.icon className={`w-4 h-4 ${stat.color} opacity-70`} />
              </div>
              <div className="text-3xl font-extrabold tracking-tight text-foreground">{stat.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scheduled Posts */}
          <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-foreground">Upcoming Scheduled Posts</h2>
              <Link href="/dashboard/calendar" className="text-sm font-semibold text-secondary hover:underline">View Calendar</Link>
            </div>
            
            <div className="space-y-1">
              {upcomingPosts.length > 0 ? upcomingPosts.map((post) => (
                <Link key={post.id} href={`/dashboard/compose?id=${post.id}`} className="flex items-center gap-4 py-4 border-b border-border last:border-0 hover:bg-accent/5 px-3 rounded-xl transition-all group cursor-pointer">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg shrink-0 flex items-center justify-center border border-accent/20 overflow-hidden">
                    {post.mediaUrls && Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0 ? (
                       <img src={post.mediaUrls[0]} alt="" className="w-full h-full object-cover" />
                    ) : (
                       <Smartphone className="w-6 h-6 text-muted group-hover:text-primary transition-colors" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold mb-1 truncate text-foreground group-hover:text-primary transition-all">{post.content}</div>
                    <div className="text-sm text-foreground/80 flex items-center gap-2">
                      <Clock className="w-4 h-4 opacity-70" />
                      {post.scheduledAt ? format(new Date(post.scheduledAt), "MMM dd, hh:mm a") : "Not set"}
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {post.results.map((r, j) => {
                      const config = PLATFORM_CONFIGS[r.platform as keyof typeof PLATFORM_CONFIGS];
                      return (
                        <div key={j} className="p-1.5 bg-accent/10 rounded-md border border-accent/20" title={config?.name}>
                          <HugeiconsIcon icon={config?.icon} size={14} style={{ color: config?.color }} />
                        </div>
                      );
                    })}
                  </div>
                </Link>
              )) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                  <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
                    <Clock className="w-8 h-8 text-muted" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">No upcoming posts</h3>
                    <p className="text-sm text-muted-foreground">Start scheduling content to see them here.</p>
                  </div>
                  <Link 
                    href="/dashboard/compose" 
                    className={cn(buttonVariants({ variant: "outline" }), "rounded-xl font-bold")}
                  >
                    Create Post
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Accounts Section */}
          <div className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6 text-foreground">Connected Accounts</h2>
              <div className="space-y-3">
                {userAccounts.length > 0 ? userAccounts.map((account) => {
                  const config = PLATFORM_CONFIGS[account.platform as keyof typeof PLATFORM_CONFIGS];
                  return (
                    <div key={account.id} className="flex items-center gap-4 p-3.5 bg-accent/5 border border-border/50 rounded-xl hover:border-secondary/50 transition-all cursor-pointer group">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center border border-accent/20 transition-all group-hover:scale-110 overflow-hidden">
                        {account.profilePictureUrl ? (
                          <img src={account.profilePictureUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <HugeiconsIcon icon={config?.icon} size={20} style={{ color: config?.color }} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-foreground truncate">{account.platformUsername || config?.name}</div>
                        <div className="text-[11px] text-muted-foreground uppercase font-black tracking-tighter">{config?.name}</div>
                      </div>
                      <div className={`w-2.5 h-2.5 rounded-full ${account.isActive ? 'bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]' : 'bg-red-500 opacity-50'}`} />
                    </div>
                  );
                }) : (
                   <div className="text-center py-6 text-sm text-muted-foreground italic">No accounts connected yet.</div>
                )}
              </div>
              <Link 
                href="/dashboard/accounts" 
                className={cn(
                  buttonVariants({ variant: "outline" }), 
                  "w-full mt-6 py-6 border-2 border-dashed border-border rounded-xl text-sm font-bold text-muted hover:border-secondary hover:text-secondary hover:bg-secondary/5 transition-all active:scale-95"
                )}
              >
                <Plus className="w-4 h-4 mr-2" />
                Connect New Account
              </Link>
            </div>

            {/* Quick Tips or Something Premium */}
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
              <div className="relative z-10">
                <h3 className="text-sm font-black uppercase tracking-widest text-primary mb-2">Pro Tip</h3>
                <p className="text-sm font-bold text-foreground leading-relaxed">
                  Posts with images get 2.3x more engagement. Use the AI transformer to optimize your visuals!
                </p>
                <Link href="/dashboard/media" className="inline-flex items-center mt-4 text-xs font-black text-secondary hover:translate-x-1 transition-transform">
                  EXPLORE MEDIA LIBRARY <ChevronRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}