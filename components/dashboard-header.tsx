import { Plus } from "lucide-react";
import { ThemeToggle } from "./theme-toggle";
import Link from "next/link";

interface HeaderProps {
  title: string;
}

export function DashboardHeader({ title }: HeaderProps) {
  return (
    <header className="h-14 border-b border-border flex items-center justify-between px-7 shrink-0 bg-background/50 backdrop-blur-sm sticky top-0 z-10">
      <h1 className="text-base font-semibold">{title}</h1>
      <div className="flex items-center gap-2.5">
        <ThemeToggle />
        <Link 
          href="/dashboard/compose"
          className="bg-primary text-white px-4 py-1.75 rounded-lg text-[13px] font-medium transition-all hover:opacity-90 shadow-md shadow-primary/20 flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create Post
        </Link>
      </div>
    </header>
  );
}
