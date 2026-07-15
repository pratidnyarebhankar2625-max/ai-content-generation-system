"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, LogOut, User, Settings, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
          {isAuthenticated && user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-all duration-300 hover:bg-muted"
              >
                <Avatar className="ring-2 ring-[#D4A843]/20 ring-offset-2 ring-offset-background transition-all duration-300 hover:ring-[#D4A843]/40">
                  <AvatarFallback className="bg-gradient-to-br from-[#1C1917] to-[#292524] text-[#D4A843] font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-foreground leading-none">{user.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user.email}</p>
                </div>
                <ChevronDown className={`hidden md:block h-4 w-4 text-muted-foreground transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fade-in-down z-50">
                  <div className="px-3 py-2.5 border-b border-border mb-1.5">
                    <p className="text-sm font-semibold text-foreground">{user.name}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <div className="border-t border-border mt-1.5 pt-1.5">
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-red-600 transition-all duration-200 hover:bg-red-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition-all hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] px-5 py-2 text-sm font-semibold text-[#D4A843] shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
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