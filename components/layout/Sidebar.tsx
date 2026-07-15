"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  History,
  User,
  Settings,
  Sparkles,
  LogOut,
  ChevronRight,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
  },
  {
    name: "Templates",
    icon: FileText,
    href: "/templates",
  },
  {
    name: "History",
    icon: History,
    href: "/history",
  },
  {
    name: "Profile",
    icon: User,
    href: "/profile",
  },
  {
    name: "Settings",
    icon: Settings,
    href: "/settings",
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  const displayName = user?.name || "User";
  const displayInitial = displayName.charAt(0).toUpperCase();
  const displayRole = user?.provider === "google" ? "Google Account" : "AI Developer";

  return (
    <aside className="flex h-screen w-72 flex-col border-r border-[#292524] bg-gradient-to-b from-[#1C1917] via-[#171412] to-[#0C0A09] animate-fade-in">
      {/* Logo */}
      <div className="border-b border-[#292524] px-6 py-7">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-gradient-to-br from-[#D4A843] via-[#B8860B] to-[#8B6914] p-3.5 shadow-[0_0_25px_rgba(212,168,67,0.25)]">
            <Sparkles className="h-6 w-6 text-[#1C1917]" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight text-[#FAF8F5]">
              AI Content Studio
            </h1>

            <p className="mt-1.5 text-xs tracking-wide text-[#A8A29E]">
              Smart Content Generation
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-6">
        {menuItems.map((item, index) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`
                  relative
                  group
                  w-full
                  justify-between
                  rounded-xl
                  px-4
                  py-6
                  text-base
                  transition-all
                  duration-300
                  ease-out
                  animate-fade-in-up
                  ${
                    isActive
                      ? "bg-[#D4A843]/15 text-[#D4A843] shadow-lg shadow-[#D4A843]/8"
                      : "text-[#A8A29E] hover:bg-[#292524]/60 hover:text-[#E7E5E4]"
                  }
                `}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-gradient-to-b from-[#D4A843] to-[#B8860B]" />
                )}

                <div className="flex items-center gap-3.5">
                  <item.icon
                    className={`h-[22px] w-[22px] transition-transform duration-300 group-hover:translate-x-0.5 ${
                      isActive ? "text-[#D4A843]" : ""
                    }`}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>

                <ChevronRight className="h-4 w-4 opacity-30 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[#292524] p-5">
        <div className="rounded-[20px] border border-[#292524] bg-[#292524]/80 p-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#D4A843] to-[#B8860B] text-lg font-semibold text-[#1C1917] shadow-md">
              {displayInitial}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-[#FAF8F5] truncate">
                {displayName}
              </h3>

              <p className="text-xs text-[#A8A29E] truncate">
                {displayRole}
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleLogout}
            className="mt-5 w-full justify-center rounded-xl border border-[#44403C] text-[#A8A29E] hover:border-[#D4A843]/40 hover:bg-[#292524] hover:text-[#D4A843] transition-all duration-300"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>
    </aside>
  );
}