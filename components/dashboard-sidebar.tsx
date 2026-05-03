"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Link2, 
  PenSquare, 
  Calendar, 
  MessageSquare, 
  Settings,
  Images,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { usePathname } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";



const navItems = [
  { label: "Main", items: [
    { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
    { label: "Analytics", icon: BarChart3, href: "/dashboard/analytics" },
    { label: "Connected Accounts", icon: Link2, href: "/dashboard/accounts" },
    { label: "Media Library", icon: Images, href: "/dashboard/media" },
    { label: "Create Post", icon: PenSquare, href: "/dashboard/compose" },
    { label: "Calendar", icon: Calendar, href: "/dashboard/calendar" },
  ]},
  { label: "Automation", items: [
    { label: "Auto-Reply Rules", icon: MessageSquare, href: "/dashboard/auto-reply" },
  ]},
  { label: "Account", items: [
    { label: "Settings", icon: Settings, href: "/dashboard/settings" },
  ]}
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border py-4">
        <Link href="/" className="flex items-center justify-center">
          <Logo className="w-36 h-9 object-contain" />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {navItems.map((section, idx) => (
          <SidebarGroup key={idx}>
            <SidebarGroupLabel className="text-xs text-muted-foreground font-bold tracking-widest uppercase px-3">
              {section.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const active = pathname === item.href;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton 
                        render={
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                              active 
                                ? "bg-primary text-white font-semibold shadow-lg shadow-primary/25" 
                                : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
                            }`}
                          />
                        } 
                        isActive={active} 
                        tooltip={item.label}
                      >
                        <item.icon className="w-5 h-5" />
                        <span>{item.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors">
          <UserButton />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-foreground truncate">
              {user?.fullName || user?.username || "Loading..."}
            </div>
            <div className="text-[11px] text-muted-foreground">
              Free Plan
            </div>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
