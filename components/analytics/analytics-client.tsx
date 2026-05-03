"use client";

import { useState } from "react";
import { format, subDays } from "date-fns";
import { 
  Calendar as CalendarIcon, 
  Filter, 
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Eye,
  MousePointer2,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent 
} from "@/components/ui/chart";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { PostPerformanceTable } from "./post-performance-table";
import { BestTimeToPost } from "./best-time-to-post";

interface AnalyticsClientProps {
  initialOverview: any;
  initialGrowthData: any[];
  initialPostPerformance: any[];
  userId: string;
}

export function AnalyticsClient({ 
  initialOverview, 
  initialGrowthData, 
  initialPostPerformance,
  userId 
}: AnalyticsClientProps) {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [platform, setPlatform] = useState("all");

  const stats = [
    { 
      label: "Total Followers", 
      value: initialOverview.followers.value.toLocaleString(), 
      prev: initialOverview.followers.prev,
      icon: Users,
      color: "text-blue-500" 
    },
    { 
      label: "Total Engagements", 
      value: initialOverview.engagements.value.toLocaleString(), 
      prev: initialOverview.engagements.prev,
      icon: MousePointer2,
      color: "text-green-500" 
    },
    { 
      label: "Impressions", 
      value: initialOverview.impressions.value.toLocaleString(), 
      prev: initialOverview.impressions.prev,
      icon: Eye,
      color: "text-purple-500" 
    },
    { 
      label: "Avg. Engagement Rate", 
      value: `${initialOverview.engagementRate.value.toFixed(2)}%`, 
      prev: initialOverview.engagementRate.prev,
      icon: TrendingUp,
      color: "text-orange-500" 
    },
  ];

  const calculateChange = (current: number, previous: number) => {
    if (!previous || previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const exportCSV = () => {
    const headers = ["Post Content", "Published Date", "Likes", "Comments", "Shares", "Reach", "Engagement Rate"];
    const rows = initialPostPerformance.map(post => {
      // Aggregate across platforms for CSV
      let likes = 0, comments = 0, shares = 0, reach = 0;
      Object.values(post.platforms).forEach((p: any) => {
        likes += p.likes;
        comments += p.comments;
        shares += p.shares;
        reach += p.reach;
      });
      
      return [
        `"${post.content.replace(/"/g, '""')}"`,
        format(new Date(post.publishedAt), "yyyy-MM-dd HH:mm"),
        likes,
        comments,
        shares,
        reach,
        `${calculateEngagementRate({ likes, comments, shares, followers: initialOverview.followers.value }).toFixed(2)}%`
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(r => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `postguru_analytics_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger render={
              <Button variant="outline" className="justify-start text-left font-normal w-[240px] h-11 rounded-xl border-border bg-card" />
            }>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(dateRange.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date range</span>
                )}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 rounded-xl shadow-2xl border-border" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => range && setDateRange(range)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>

          <Select value={platform} onValueChange={(val) => setPlatform(val || "all")}>
            <SelectTrigger className="w-[180px] h-11 rounded-xl border-border bg-card">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue placeholder="All Platforms" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-border shadow-xl">
              <SelectItem value="all">All Platforms</SelectItem>
              <SelectItem value="TWITTER">Twitter/X</SelectItem>
              <SelectItem value="FACEBOOK">Facebook</SelectItem>
              <SelectItem value="INSTAGRAM">Instagram</SelectItem>
              <SelectItem value="LINKEDIN">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={exportCSV} variant="secondary" className="h-11 rounded-xl font-bold gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const change = calculateChange(parseFloat(stat.value.replace(/,/g, '')), parseFloat(String(stat.prev || 0)));
          const isPositive = change >= 0;

          return (
            <Card key={i} className="border-border bg-card rounded-2xl shadow-sm hover:border-primary/50 transition-all group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={cn("p-2 rounded-lg bg-accent/10", stat.color)}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className={cn(
                    "flex items-center text-xs font-bold px-2 py-1 rounded-full",
                    isPositive ? "text-green-500 bg-green-500/10" : "text-red-500 bg-red-500/10"
                  )}>
                    {isPositive ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                    {Math.abs(change).toFixed(1)}%
                  </div>
                </div>
                <div className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</div>
                <div className="text-2xl font-extrabold tracking-tight text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground mt-2 uppercase font-black tracking-widest opacity-70">Vs. Previous Period</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Growth Chart */}
      <Card className="border-border bg-card rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
          <div>
            <CardTitle className="text-lg font-bold">Follower Growth</CardTitle>
            <CardDescription>Follower trends across active platforms</CardDescription>
          </div>
          <div className="flex gap-4 text-xs font-bold text-muted-foreground">
             <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Twitter</div>
             <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-pink-500" /> Instagram</div>
             <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-blue-600" /> Facebook</div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={initialGrowthData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val ? format(new Date(val), "MMM dd") : ""}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(val) => val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                />
                <Tooltip 
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card border border-border p-3 rounded-xl shadow-xl">
                          <p className="text-xs font-bold mb-2">{label ? format(new Date(label), "MMMM dd, yyyy") : ""}</p>
                          {payload.map((entry: any, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-xs">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                              <span className="text-muted-foreground">{entry.name}:</span>
                              <span className="font-bold">{entry.value.toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="TWITTER" name="Twitter" stroke="hsl(var(--primary))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="INSTAGRAM" name="Instagram" stroke="#E4405F" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="FACEBOOK" name="Facebook" stroke="#1877F2" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="LINKEDIN" name="LinkedIn" stroke="#0077B5" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Post Performance & Best Time */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PostPerformanceTable data={initialPostPerformance} />
        </div>
        <div className="lg:col-span-1">
          <BestTimeToPost postsCount={initialPostPerformance.length} />
        </div>
      </div>
    </div>
  );
}

function calculateEngagementRate(metrics: { likes: number; comments: number; shares: number; followers: number }) {
  if (!metrics.followers || metrics.followers === 0) return 0;
  return ((metrics.likes + metrics.comments + metrics.shares) / metrics.followers) * 100;
}
