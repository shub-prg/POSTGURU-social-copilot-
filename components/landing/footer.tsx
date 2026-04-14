import Link from "next/link";
import { Twitter, Linkedin, Github } from "lucide-react";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="bg-card py-12 border-t border-border/40">
      <div className="container px-4 md:px-8 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
        
        <div className="flex items-center gap-2">
          <Logo className="w-32 h-8 object-contain" />
        </div>

        <div className="flex gap-6 text-sm text-muted-foreground font-medium">
          <Link href="#features" className="hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="hover:text-primary transition-colors">How It Works</Link>
          <Link href="#faq" className="hover:text-primary transition-colors">FAQ</Link>
          <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
        </div>

        <div className="flex items-center gap-4 text-muted-foreground">
          <Link href="#" className="hover:text-primary transition-colors">
            <span className="sr-only">Twitter</span>
            <Twitter className="h-5 w-5" />
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            <span className="sr-only">LinkedIn</span>
            <Linkedin className="h-5 w-5" />
          </Link>
          <Link href="#" className="hover:text-primary transition-colors">
            <span className="sr-only">GitHub</span>
            <Github className="h-5 w-5" />
          </Link>
        </div>
      </div>
      
      <div className="container mx-auto px-4 md:px-8 mt-8 text-center text-sm text-muted-foreground font-sans">
        <p>© {new Date().getFullYear()} PostGuru AI. All rights reserved.</p>
      </div>
    </footer>
  );
}
