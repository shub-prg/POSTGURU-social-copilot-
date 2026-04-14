import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/logo";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background text-foreground transition-colors duration-300">
        <DashboardSidebar />
        <SidebarInset>
          {/* Mobile Header with Trigger */}
          <header className="flex h-14 items-center gap-4 border-b border-border bg-card px-6 lg:hidden">
            <SidebarTrigger className="-ml-2" />
            <Link href="/" className="flex items-center">
              <Logo className="w-32 h-8 object-contain" />
            </Link>
          </header>
          
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
