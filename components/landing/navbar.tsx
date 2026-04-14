import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@clerk/nextjs/server";
import { Logo } from "@/components/logo";

export async function Navbar() {
  const { userId } = await auth();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between mx-auto px-4 md:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center space-x-2">
            <Logo className="w-40 h-10 object-contain" />
          </Link>
          {/* Main Navigation */}
          <nav className="hidden md:flex items-center gap-8 ml-10 text-[15px] font-bold tracking-wide">
            <Link href="#features" className="transition-colors hover:text-foreground text-foreground/80">Features</Link>
            <Link href="#how-it-works" className="transition-colors hover:text-foreground text-foreground/80">How It Works</Link>
            <Link href="#faq" className="transition-colors hover:text-foreground text-foreground/80">FAQ</Link>
          </nav>
        </div>

        <div className="flex items-center space-x-4">
          <ThemeToggle />
          <nav className="flex items-center space-x-2">
            {userId ? (
              <Button render={<Link href="/dashboard" />} nativeButton={false} size="sm" className="hidden sm:inline-flex">
                Dashboard
              </Button>
            ) : (
              <>
                <Button variant="ghost" render={<Link href="/sign-in" />} nativeButton={false} size="sm" className="hidden sm:inline-flex">
                  Sign In
                </Button>
                <Button render={<Link href="/sign-up" />} nativeButton={false} size="sm">
                  Get Started
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
