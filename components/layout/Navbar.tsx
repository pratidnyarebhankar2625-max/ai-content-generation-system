"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { useSidebar } from "@/lib/sidebar-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, User, Settings, ChevronDown, Menu, Bell, Sparkles } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll for dynamic shadow/border
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setShowDropdown(false);
    logout();
    router.push("/login");
  }

  const initials = user
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <nav 
      className={`sticky top-0 z-50 h-16 w-full transition-all duration-300 ${
        scrolled 
          ? "border-b border-border/50 bg-white/85 dark:bg-[#0B192C]/85 backdrop-blur-xl shadow-sm" 
          : "border-b border-border bg-white dark:bg-[#0B192C]"
      }`}
    >
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-4 sm:px-6">

        {/* Left Side: Toggle & Logo */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={toggleSidebar}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-sidebar/80 dark:text-foreground/80 transition-all duration-300 hover:bg-muted hover:text-sidebar dark:hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[#113680]/50"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link href="/" className="flex items-center gap-3 transition-transform duration-300 hover:scale-[1.02] focus:outline-none">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#113680] to-[#fe4443] shadow-md">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <h1 className="hidden sm:block font-heading text-[22px] font-bold tracking-tight text-[#113680] dark:text-[#F8FAFC]">
              AI Content Studio
            </h1>
          </Link>
        </div>

        {/* Right Side: Notifications & User */}
        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && user ? (
            <>
              {/* Notification Bell */}
              <button className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-sidebar/70 dark:text-foreground/70 transition-all duration-300 hover:bg-muted hover:text-sidebar dark:hover:text-foreground focus:outline-none focus:ring-2 focus:ring-[#113680]/50">
                <Bell className="h-[22px] w-[22px]" />
                <span className="absolute right-2.5 top-2.5 flex h-2 w-2 rounded-full bg-[#fe4443] ring-2 ring-white dark:ring-[#0B192C]"></span>
              </button>

              {/* Separator */}
              <div className="hidden h-6 w-px bg-border sm:block"></div>

              {/* User Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="group flex items-center gap-3 rounded-xl border border-transparent p-1 pr-2 transition-all duration-300 hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#113680]/50"
                  aria-expanded={showDropdown}
                  aria-haspopup="true"
                >
                  <Avatar className="h-9 w-9 shadow-sm ring-2 ring-transparent transition-all duration-300 group-hover:ring-[#113680]/20 dark:group-hover:ring-white/20">
                    {user.avatar && <AvatarImage src={user.avatar} alt={user.name} />}
                    <AvatarFallback className="bg-gradient-to-br from-[#113680] to-[#3b82f6] text-white font-semibold text-xs">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden text-left md:block">
                    <p className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC] leading-none">
                      {user.name}
                    </p>
                    <p className="text-xs font-medium text-muted-foreground mt-1">
                      {user.provider === "google" ? "Pro Plan" : "Admin"}
                    </p>
                  </div>
                  <ChevronDown 
                    className={`hidden h-4 w-4 text-muted-foreground transition-transform duration-300 md:block ${showDropdown ? "rotate-180 text-[#113680] dark:text-white" : "group-hover:text-[#113680] dark:group-hover:text-white"}`} 
                  />
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-64 origin-top-right rounded-2xl border border-border/80 bg-card p-2 shadow-[var(--shadow-elevated)] animate-fade-in-down z-50">
                    <div className="mb-2 px-3 py-3">
                      <p className="font-heading text-lg font-semibold text-foreground tracking-tight">{user.name}</p>
                      <p className="text-sm font-medium text-muted-foreground truncate">{user.email}</p>
                    </div>
                    
                    <div className="mb-2 h-px w-full bg-border/50"></div>

                    <div className="space-y-1">
                      <Link
                        href="/profile"
                        onClick={() => setShowDropdown(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                      >
                        <User className="h-[18px] w-[18px] transition-colors group-hover:text-[#113680] dark:group-hover:text-white" />
                        My Profile
                      </Link>

                      <Link
                        href="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                      >
                        <Settings className="h-[18px] w-[18px] transition-colors group-hover:text-[#113680] dark:group-hover:text-white" />
                        Account Settings
                      </Link>
                    </div>

                    <div className="my-2 h-px w-full bg-border/50"></div>

                    <button
                      onClick={handleLogout}
                      className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      <LogOut className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-semibold text-sidebar/80 dark:text-foreground/80 transition-all hover:bg-muted hover:text-sidebar dark:hover:text-foreground"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-[#fe4443] px-5 py-2 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}