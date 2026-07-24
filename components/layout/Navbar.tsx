"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { useSidebar } from "@/lib/sidebar-store";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogOut, User, Settings, ChevronDown, Menu } from "lucide-react";

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { toggleSidebar } = useSidebar();
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
    <nav className="relative z-50 h-16 border-b border-border bg-white text-sidebar shadow-[0_1px_3px_rgba(28,25,23,0.04)] animate-fade-in-down">
      <div className="mx-auto flex h-full max-w-screen-2xl items-center justify-between px-6">

        {/* Left Side: Toggle & Logo */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card shadow-sm transition-all hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#567C8D]/50"
            aria-label="Toggle Sidebar"
          >
            <Menu className="h-5 w-5 text-sidebar" />
          </button>

          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#567C8D] to-[#567C8D] shadow-sm"></div>
            <h1 className="text-lg font-semibold tracking-tight text-sidebar">
              AI Content Studio
            </h1>
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
                <Avatar className="ring-2 ring-border ring-offset-2 ring-offset-white transition-all duration-300 hover:ring-sidebar/40">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-primary-foreground font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-sidebar leading-none">{user.name}</p>
                  <p className="text-xs text-sidebar/70 mt-0.5">{user.email}</p>
                </div>
                <ChevronDown className={`hidden md:block h-4 w-4 text-sidebar/70 transition-transform duration-300 ${showDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-border bg-card p-1.5 shadow-xl animate-fade-in-down z-50">
                  <div className="px-3 py-2.5 border-b border-border mb-1.5">
                    <p className="text-sm font-semibold text-sidebar">{user.name}</p>
                    <p className="text-xs text-sidebar/70">{user.email}</p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-sidebar/70 transition-all duration-200 hover:bg-muted hover:text-sidebar"
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm text-sidebar/70 transition-all duration-200 hover:bg-muted hover:text-sidebar"
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
                className="rounded-xl px-4 py-2 text-sm font-medium text-sidebar/70 transition-all hover:text-sidebar"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-all duration-300 hover:shadow-md hover:scale-[1.02]"
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