import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="h-16 border-b border-border bg-card/80 backdrop-blur-sm shadow-[0_1px_3px_rgba(28,25,23,0.04)] animate-fade-in-down">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-6">

        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#D4A843] to-[#B8860B] shadow-sm"></div>

          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            AI Content Studio
          </h1>
        </div>

       {/* Search Bar */}
        <div className="flex flex-1 justify-center px-8">
          <div className="relative w-full max-w-lg">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground transition-colors duration-300" />
            <input
              placeholder="Search templates, projects, history..."
              className="h-12 w-full rounded-2xl border border-border bg-[var(--surface-input)] pl-12 pr-5 text-sm shadow-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
            />
          </div>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-4">
          <Avatar className="ring-2 ring-[#D4A843]/20 ring-offset-2 ring-offset-background transition-all duration-300 hover:ring-[#D4A843]/40">
            <AvatarFallback className="bg-gradient-to-br from-[#1C1917] to-[#292524] text-[#D4A843] font-semibold">
              PR
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </nav>
  );
}