"use client";

import React, { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Twitter, Linkedin, Instagram, Facebook, Youtube, Globe,
  Trash2, Edit, Copy, Clock, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, CalendarDays, LayoutGrid,
  Sparkles, Filter
} from "lucide-react";
import { toast } from "sonner";

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  TWITTER: Twitter,
  LINKEDIN: Linkedin,
  INSTAGRAM: Instagram,
  FACEBOOK: Facebook,
  YOUTUBE: Youtube,
  REDDIT: Globe,
};

const PLATFORM_COLORS: Record<string, string> = {
  TWITTER: "#38bdf8",
  LINKEDIN: "#60a5fa",
  INSTAGRAM: "#f472b6",
  FACEBOOK: "#818cf8",
  YOUTUBE: "#f87171",
  REDDIT: "#fb923c",
};

const PLATFORM_GRADIENTS: Record<string, string> = {
  TWITTER: "from-sky-500/20 to-sky-500/5",
  LINKEDIN: "from-blue-500/20 to-blue-500/5",
  INSTAGRAM: "from-pink-500/20 to-pink-500/5",
  FACEBOOK: "from-indigo-500/20 to-indigo-500/5",
  YOUTUBE: "from-red-500/20 to-red-500/5",
  REDDIT: "from-orange-500/20 to-orange-500/5",
};

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType }> = {
  SCHEDULED: { color: "#a78bfa", bg: "rgba(167,139,250,0.12)", icon: Clock },
  PUBLISHED: { color: "#34d399", bg: "rgba(52,211,153,0.12)", icon: CheckCircle2 },
  DRAFT: { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", icon: Edit },
  FAILED: { color: "#f87171", bg: "rgba(248,113,113,0.12)", icon: AlertCircle },
};

interface Post {
  id: string;
  content: string;
  mediaUrls: { url: string; [key: string]: unknown }[] | string[];
  scheduledAt: string | null;
  status: string;
  results: { platform: string; status: string }[];
}

interface ContentCalendarProps {
  initialPosts: Post[];
}

export function ContentCalendar({ initialPosts }: ContentCalendarProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [currentView, setCurrentView] = useState("dayGridMonth");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [mainView, setMainView] = useState<"calendar" | "posts">("calendar");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [currentTitle, setCurrentTitle] = useState("");
  const calendarRef = useRef<FullCalendar>(null);

  useEffect(() => {
    setTimeout(() => {
      calendarRef.current?.getApi().updateSize();
      setCurrentTitle(calendarRef.current?.getApi().view.title || "");
    }, 100);
  }, [currentView]);

  const navigate = (dir: "prev" | "next" | "today") => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    if (dir === "prev") api.prev();
    else if (dir === "next") api.next();
    else api.today();
    setTimeout(() => setCurrentTitle(api.view.title), 50);
  };

  const handleDelete = async () => {
    if (!selectedPost) return;
    if (!confirm("Delete this post? This will cancel any scheduled jobs.")) return;
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setPosts(posts.filter(p => p.id !== selectedPost.id));
      setIsSheetOpen(false);
      toast.success("Post deleted");
    } catch {
      toast.error("Failed to delete post");
    }
  };

  const handleEdit = () => {
    if (!selectedPost) return;
    localStorage.setItem("post-draft", JSON.stringify({
      content: selectedPost.content,
      selectedPlatforms: selectedPost.results.map(r => r.platform)
    }));
    router.push(`/dashboard/compose`);
  };

  const handleDuplicate = () => {
    if (!selectedPost) return;
    localStorage.setItem("post-draft", JSON.stringify({
      content: selectedPost.content,
      selectedPlatforms: selectedPost.results.map(r => r.platform)
    }));
    toast.success("Copied to composer");
    router.push(`/dashboard/compose`);
  };

  const handleDateClick = (arg: { date: Date }) => {
    const dateStr = format(arg.date, "yyyy-MM-dd'T'HH:mm:ss");
    router.push(`/dashboard/compose?date=${encodeURIComponent(dateStr)}`);
  };

  const handleEventClick = (arg: { event: { id: string } }) => {
    const post = posts.find(p => p.id === arg.event.id);
    if (post) { setSelectedPost(post); setIsSheetOpen(true); }
  };

  const filteredPosts = posts.filter(post => {
    const platforms = post.results.map(r => r.platform);
    if (selectedPlatforms.length > 0 && !platforms.some(p => selectedPlatforms.includes(p))) return false;
    if (selectedStatuses.length > 0 && !selectedStatuses.includes(post.status)) return false;
    return true;
  });

  const events = filteredPosts.map(post => {
    const mainPlatform = post.results[0]?.platform || "TWITTER";
    const color = PLATFORM_COLORS[mainPlatform] || "#94a3b8";
    return {
      id: post.id,
      title: post.content || "Media Post",
      start: post.scheduledAt || new Date().toISOString(),
      backgroundColor: color + "22",
      borderColor: color + "55",
      textColor: color,
      extendedProps: { post }
    };
  });

  const activeFiltersCount = selectedPlatforms.length + selectedStatuses.length;

  const scheduledCount = posts.filter(p => p.status === 'SCHEDULED').length;
  const publishedCount = posts.filter(p => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter(p => p.status === 'DRAFT').length;
  const failedCount = posts.filter(p => p.status === 'FAILED').length;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        .pg-calendar-wrap * { font-family: 'DM Sans', sans-serif; }

        /* FullCalendar overrides */
        .pg-calendar-wrap .fc {
          --fc-border-color: hsl(var(--border) / 0.5);
          --fc-today-bg-color: hsl(var(--primary) / 0.05);
          --fc-neutral-bg-color: transparent;
          --fc-page-bg-color: transparent;
        }
        .pg-calendar-wrap .fc-theme-standard td,
        .pg-calendar-wrap .fc-theme-standard th {
          border-color: hsl(var(--border) / 0.5);
        }
        .pg-calendar-wrap .fc-col-header-cell {
          padding: 12px 0;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: hsl(var(--muted-foreground));
          background: hsl(var(--muted) / 0.3);
        }
        .pg-calendar-wrap .fc-daygrid-day-number {
          font-size: 0.78rem;
          font-weight: 500;
          color: hsl(var(--muted-foreground));
          padding: 8px 10px;
          transition: color 0.2s;
        }
        .pg-calendar-wrap .fc-daygrid-day:hover .fc-daygrid-day-number {
          color: hsl(var(--foreground));
        }
        .pg-calendar-wrap .fc-day-today .fc-daygrid-day-number {
          color: hsl(var(--primary)) !important;
          font-weight: 700;
        }
        .pg-calendar-wrap .fc-day-today {
          background: hsl(var(--primary) / 0.05) !important;
        }
        .pg-calendar-wrap .fc-daygrid-day-top {
          flex-direction: row-reverse;
        }
        .pg-calendar-wrap .fc-event {
          cursor: pointer;
          border-radius: 6px;
          padding: 3px 7px;
          font-size: 0.7rem;
          font-weight: 500;
          margin: 1px 2px;
          backdrop-filter: blur(4px);
          transition: all 0.15s ease;
        }
        .pg-calendar-wrap .fc-event:hover {
          filter: brightness(1.1);
          transform: translateY(-1px);
        }
        .pg-calendar-wrap .fc-daygrid-event-dot { display: none; }
        .pg-calendar-wrap .fc-event-title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pg-calendar-wrap .fc-toolbar { display: none !important; }
        .pg-calendar-wrap .fc-scrollgrid {
          border-radius: 12px;
          overflow: hidden;
          border-color: hsl(var(--border) / 0.5) !important;
        }
        .pg-calendar-wrap .fc-scrollgrid-section-header td {
          border: none;
        }
        .pg-calendar-wrap .fc-daygrid-day-frame {
          min-height: 90px;
          padding: 2px;
        }
        .pg-calendar-wrap .fc-more-link {
          font-size: 0.65rem;
          color: hsl(var(--primary));
          padding: 1px 6px;
          background: hsl(var(--primary) / 0.1);
          border-radius: 4px;
          margin: 1px 2px;
        }
        .pg-calendar-wrap .fc-more-link:hover { background: hsl(var(--primary) / 0.2); }

        /* Sheet scrollbar */
        .pg-sheet-scroll::-webkit-scrollbar { width: 4px; }
        .pg-sheet-scroll::-webkit-scrollbar-track { background: transparent; }
        .pg-sheet-scroll::-webkit-scrollbar-thumb { background: hsl(var(--border)); border-radius: 4px; }

        /* Glow pulse on today */
        @keyframes todayPulse {
          0%, 100% { box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.2); }
          50% { box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.5); }
        }
        .pg-calendar-wrap .fc-day-today {
          animation: todayPulse 3s ease-in-out infinite;
        }

        /* Platform badge hover */
        .platform-badge { transition: all 0.15s ease; }
        .platform-badge:hover { transform: translateY(-1px); }

        /* View toggle */
        .view-btn { transition: all 0.2s ease; }
      `}</style>

      <div className="pg-calendar-wrap flex flex-col h-full gap-6" style={{ fontFamily: "'DM Sans', sans-serif" }}>

        {/* ── Main View Selector ── */}
        <div 
          className="flex items-center justify-between px-6 py-3 rounded-2xl bg-white dark:bg-white/5 border border-border shadow-sm backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 p-1 rounded-xl bg-muted/50 border border-border">
            <button
              onClick={() => setMainView("calendar")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: mainView === "calendar" ? "hsl(var(--foreground))" : "transparent",
                color: mainView === "calendar" ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                boxShadow: mainView === "calendar" ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
              }}
            >
              <CalendarDays size={16} />
              Calendar View
            </button>
            <button
              onClick={() => setMainView("posts")}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all"
              style={{
                background: mainView === "posts" ? "hsl(var(--foreground))" : "transparent",
                color: mainView === "posts" ? "hsl(var(--background))" : "hsl(var(--muted-foreground))",
                boxShadow: mainView === "posts" ? "0 4px 12px rgba(0,0,0,0.1)" : "none"
              }}
            >
              <LayoutGrid size={16} />
              Posts View
            </button>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[10px] font-extrabold tracking-[0.15em] text-muted-foreground uppercase">Summary</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-violet-400 shadow-[0_0_8px_rgba(167,139,250,0.5)]" />
                <span className="text-sm font-bold text-foreground">{scheduledCount}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scheduled</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                <span className="text-sm font-bold text-foreground">{publishedCount}</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Published</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top Controls Bar ── */}
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-5 py-4 rounded-2xl bg-white dark:bg-white/5 border border-border shadow-sm backdrop-blur-md"
        >
          {/* Left: Navigation */}
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <div
              className="flex items-center p-1 rounded-xl gap-1 bg-black/10 dark:bg-white/10 border border-border/50"
            >
              {[
                { key: "dayGridMonth", label: "Month", Icon: LayoutGrid },
                { key: "timeGridWeek", label: "Week", Icon: CalendarDays },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setCurrentView(key);
                    calendarRef.current?.getApi().changeView(key);
                    setTimeout(() => setCurrentTitle(calendarRef.current?.getApi().view.title || ""), 50);
                  }}
                  className="view-btn flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: currentView === key ? "rgba(139,92,246,0.3)" : "transparent",
                    color: currentView === key ? "#c4b5fd" : "hsl(var(--muted-foreground))",
                    border: currentView === key ? "1px solid rgba(139,92,246,0.4)" : "1px solid transparent",
                  }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              ))}
            </div>

            {/* Calendar Nav */}
            <div className="flex items-center gap-1">
              {[
                { action: "prev" as const, Icon: ChevronLeft },
                { action: "next" as const, Icon: ChevronRight },
              ].map(({ action, Icon }) => (
                <button
                  key={action}
                  onClick={() => navigate(action)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg transition-all duration-150 hover:bg-white/10"
                  style={{ color: "hsl(var(--muted-foreground))" }}
                >
                  <Icon size={16} />
                </button>
              ))}
              <button
                onClick={() => navigate("today")}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 hover:bg-white/10"
                style={{ color: "hsl(var(--muted-foreground))" }}
              >
                Today
              </button>
            </div>

            {/* Current Month Title */}
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {currentTitle}
            </h2>
          </div>

          {/* Right: Filters */}
          <div className="flex flex-col gap-3">
            {/* Row 1: Platforms */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs min-w-[60px]" style={{ color: "hsl(var(--foreground))", opacity: 0.8 }}>
                <Filter size={11} />
                <span style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, fontSize: "0.65rem" }}>Filter</span>
              </div>
              <div style={{ width: 1, height: 16, background: "hsl(var(--border))" }} />
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(PLATFORM_ICONS).map(([platform, Icon]) => {
                  const isSelected = selectedPlatforms.includes(platform);
                  const color = PLATFORM_COLORS[platform];
                  return (
                    <button
                      key={platform}
                      onClick={() => setSelectedPlatforms(prev =>
                        prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
                      )}
                      className="platform-badge flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: isSelected ? color + "22" : "hsl(var(--muted) / 0.5)",
                        border: `1px solid ${isSelected ? color + "55" : "hsl(var(--border))"}`,
                        color: isSelected ? color : "hsl(var(--foreground))",
                      }}
                    >
                      <Icon size={11} />
                      <span style={{ fontSize: "0.65rem", letterSpacing: "0.04em" }}>{platform}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Status */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs min-w-[60px]" style={{ color: "hsl(var(--foreground))", opacity: 0.8 }}>
                <Sparkles size={11} />
                <span style={{ letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 700, fontSize: "0.65rem" }}>Status</span>
              </div>
              <div style={{ width: 1, height: 16, background: "hsl(var(--border))" }} />
              <div className="flex items-center gap-1.5 flex-wrap">
                {Object.entries(STATUS_CONFIG).map(([status, { color, bg, icon: StatusIcon }]) => {
                  const isSelected = selectedStatuses.includes(status);
                  return (
                    <button
                      key={status}
                      onClick={() => setSelectedStatuses(prev =>
                        prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
                      )}
                      className="platform-badge flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: isSelected ? bg : "hsl(var(--muted) / 0.5)",
                        border: `1px solid ${isSelected ? color + "55" : "hsl(var(--border))"}`,
                        color: isSelected ? color : "hsl(var(--foreground))",
                      }}
                    >
                      <StatusIcon size={10} />
                      <span style={{ fontSize: "0.65rem", letterSpacing: "0.04em" }}>{status}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Calendar / Posts Body ── */}
        {mainView === "calendar" ? (
          <div
            className="flex-1 bg-white dark:bg-white/[0.02] border border-border rounded-[20px] overflow-hidden min-h-[560px] p-4 relative shadow-sm"
          >
            {/* Subtle grid background */}
            <div style={{
              position: "absolute", inset: 0, borderRadius: 20, pointerEvents: "none",
              backgroundImage: "radial-gradient(circle at 20% 20%, rgba(139,92,246,0.04) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(56,189,248,0.03) 0%, transparent 50%)",
            }} />

            <FullCalendar
              ref={calendarRef}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={false}
              events={events}
              dateClick={handleDateClick}
              eventClick={handleEventClick}
              height="100%"
              dayMaxEvents={3}
              eventContent={(eventInfo) => {
                const post = eventInfo.event.extendedProps.post as Post;
                const mainPlatform = post.results[0]?.platform || "TWITTER";
                const Icon = PLATFORM_ICONS[mainPlatform] || Twitter;
                const color = PLATFORM_COLORS[mainPlatform];
                return (
                  <div className="flex items-center gap-1 overflow-hidden w-full px-1" style={{ color }}>
                    <Icon size={9} style={{ flexShrink: 0 }} />
                    <span className="truncate" style={{ fontSize: "0.68rem", fontWeight: 500 }}>
                      {eventInfo.event.title}
                    </span>
                  </div>
                );
              }}
            />
          </div>
        ) : (
          <div className="flex-1 space-y-6">
            {/* Posts Grid Controls */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-4">
                {['All', 'Draft', 'Scheduled', 'Published', 'Failed'].map(tab => {
                  const count = tab === 'All' ? posts.length : 
                               tab === 'Draft' ? draftCount :
                               tab === 'Scheduled' ? scheduledCount :
                               tab === 'Published' ? publishedCount : failedCount;
                  return (
                    <button 
                      key={tab}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                      style={{
                        background: (tab === 'All' && selectedStatuses.length === 0) || selectedStatuses.includes(tab.toUpperCase()) ? "hsl(var(--accent))" : "transparent",
                        color: (tab === 'All' && selectedStatuses.length === 0) || selectedStatuses.includes(tab.toUpperCase()) ? "hsl(var(--accent-foreground))" : "hsl(var(--muted-foreground))"
                      }}
                      onClick={() => {
                        if (tab === 'All') setSelectedStatuses([]);
                        else setSelectedStatuses([tab.toUpperCase()]);
                      }}
                    >
                      {tab}
                      <span className="text-[0.65rem] opacity-40">{count}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex items-center gap-2 text-xs text-white/40 font-medium">
                <AlertCircle size={14} />
                Showing {filteredPosts.length} posts
              </div>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredPosts.map(post => {
                const mainPlatform = post.results[0]?.platform || "TWITTER";
                const Icon = PLATFORM_ICONS[mainPlatform] || Twitter;
                const statusConfig = STATUS_CONFIG[post.status];
                const date = post.scheduledAt ? new Date(post.scheduledAt) : new Date();

                return (
                  <div 
                    key={post.id}
                    onClick={() => { setSelectedPost(post); setIsSheetOpen(true); }}
                    className="group relative flex flex-col bg-card border border-border rounded-3xl overflow-hidden cursor-pointer transition-all hover:border-primary/30 hover:-translate-y-1 shadow-sm hover:shadow-xl hover:shadow-primary/5"
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between p-5 pb-3">
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-black/20 border border-white/5">
                        <Icon size={18} style={{ color: PLATFORM_COLORS[mainPlatform] }} />
                      </div>
                      <Badge 
                        variant="outline" 
                        className="gap-1.5 py-1 px-3 border-white/10 text-[0.65rem] font-bold"
                        style={{ color: statusConfig?.color, background: statusConfig?.bg }}
                      >
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: statusConfig?.color }} />
                        {post.status}
                      </Badge>
                    </div>

                    {/* Card Media Preview (if exists) */}
                    <div className="px-5 py-2">
                      <div className="aspect-[16/10] rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center relative">
                        {post.mediaUrls && post.mediaUrls.length > 0 ? (
                          <img 
                            src={typeof post.mediaUrls[0] === 'string' ? post.mediaUrls[0] : (post.mediaUrls[0] as {url: string}).url} 
                            className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" 
                            alt="Preview" 
                          />
                        ) : (
                          <div className="flex flex-col items-center gap-2 opacity-10">
                            <Sparkles size={32} />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 pt-3 flex-1 flex flex-col gap-4">
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed font-medium">
                        {post.content || "No content provided."}
                      </p>
                      
                      <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-1.5 text-[0.7rem] text-white/40 font-bold uppercase tracking-wider">
                            <Clock size={10} />
                            {format(date, "MMM d, yyyy")}
                          </div>
                          <div className="text-[0.65rem] text-white/20 font-medium">
                            {format(date, "h:mm a")}
                          </div>
                        </div>
                        <button className="w-8 h-8 rounded-xl flex items-center justify-center bg-white/5 border border-white/10 text-white/40 group-hover:bg-violet-500/20 group-hover:text-violet-300 group-hover:border-violet-500/30 transition-all">
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Platform Legend ── */}

        {/* ── Platform Legend ── */}
        <div
          className="flex items-center gap-5 flex-wrap px-4 py-3 rounded-xl bg-black/5 dark:bg-white/5 border border-border/50"
        >
          <span style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(148,163,184,0.4)" }}>
            Platforms
          </span>
          {Object.entries(PLATFORM_COLORS).map(([platform, color]) => {
            const Icon = PLATFORM_ICONS[platform] || Twitter;
            return (
              <div key={platform} className="flex items-center gap-1.5">
                <div
                  className="flex items-center justify-center w-4 h-4 rounded-full"
                  style={{ background: color + "22", border: `1px solid ${color}55` }}
                >
                  <Icon size={9} style={{ color }} />
                </div>
                <span style={{ fontSize: "0.7rem", color: "rgba(148,163,184,0.6)", textTransform: "capitalize" }}>
                  {platform.charAt(0) + platform.slice(1).toLowerCase()}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Post Detail Sheet ── */}
      <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
        <SheetContent
          className="pg-sheet-scroll overflow-y-auto bg-background border-l border-border shadow-2xl p-8"
          style={{ width: "min(520px, 100vw)" }}
        >
          <SheetHeader className="pb-6 border-b" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            <SheetTitle style={{ fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#f8fafc", fontSize: "1.2rem", letterSpacing: "-0.02em" }}>
              Post Details
            </SheetTitle>
          </SheetHeader>

          {selectedPost && (() => {
            const StatusIcon = STATUS_CONFIG[selectedPost.status]?.icon || Clock;
            const statusColor = STATUS_CONFIG[selectedPost.status]?.color || "#94a3b8";
            const statusBg = STATUS_CONFIG[selectedPost.status]?.bg || "rgba(148,163,184,0.1)";
            return (
              <div className="space-y-10 pt-8 pb-12">

                {/* Date + Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2" style={{ color: "rgba(148,163,184,0.7)", fontSize: "0.8rem" }}>
                    <Clock size={13} />
                    <span>
                      {selectedPost.scheduledAt
                        ? format(new Date(selectedPost.scheduledAt), "MMM d, yyyy · h:mm a")
                        : "No date scheduled"}
                    </span>
                  </div>
                  <div
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
                    style={{ background: statusBg, color: statusColor, border: `1px solid ${statusColor}33` }}
                  >
                    <StatusIcon size={11} />
                    {selectedPost.status}
                  </div>
                </div>

                {/* Platforms */}
                <div className="space-y-3">
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)" }}>
                    Target Platforms
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPost.results.map(r => {
                      const Icon = PLATFORM_ICONS[r.platform] || Twitter;
                      const color = PLATFORM_COLORS[r.platform];
                      return (
                        <div
                          key={r.platform}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: color + "15", border: `1px solid ${color}40`, color }}
                        >
                          <Icon size={12} />
                          <span style={{ textTransform: "capitalize" }}>{r.platform.toLowerCase()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h4 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)" }}>
                    Post Content
                  </h4>
                  <div
                    className="p-5 rounded-2xl whitespace-pre-wrap text-[0.925rem] leading-relaxed"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: selectedPost.content ? "#e2e8f0" : "rgba(148,163,184,0.4)",
                      fontStyle: selectedPost.content ? "normal" : "italic",
                      lineHeight: 1.8,
                      boxShadow: "inset 0 2px 4px rgba(0,0,0,0.1)",
                    }}
                  >
                    {selectedPost.content || "No text content provided for this post."}
                  </div>
                </div>

                {/* Media */}
                {selectedPost.mediaUrls?.length > 0 && (
                  <div className="space-y-3">
                    <h4 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(148,163,184,0.5)" }}>
                      Media Assets
                    </h4>
                    <div className={selectedPost.mediaUrls.length === 1 ? "block" : "grid grid-cols-2 gap-3"}>
                      {selectedPost.mediaUrls.map((m: unknown, idx: number) => {
                        const url = typeof m === "string" ? m : (m as { url: string }).url;
                        const isVideo = url.match(/\.(mp4|webm|ogg)$/i);
                        return (
                          <div
                            key={idx}
                            className={`relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl ${selectedPost.mediaUrls.length === 1 ? "aspect-video" : "aspect-square"}`}
                          >
                            {isVideo
                              ? <video src={url} controls className="w-full h-full object-cover" />
                              : <img src={url} alt={`Media ${idx}`} className="w-full h-full object-cover transition-transform hover:scale-105 duration-500" />
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div
                  className="flex items-center gap-3 pt-8"
                  style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <button
                    onClick={handleDuplicate}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150 hover:bg-white/10"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.09)", color: "#94a3b8" }}
                  >
                    <Copy size={13} />
                    Duplicate
                  </button>
                  <button
                    onClick={handleEdit}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{ background: "rgba(139,92,246,0.15)", border: "1px solid rgba(139,92,246,0.3)", color: "#a78bfa" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(139,92,246,0.25)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(139,92,246,0.15)")}
                  >
                    <Edit size={13} />
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-150"
                    style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#f87171" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.2)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.1)")}
                  >
                    <Trash2 size={13} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </>
  );
}
