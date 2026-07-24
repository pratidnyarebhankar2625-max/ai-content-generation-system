"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-store";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  History,
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

];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { isOpen } = useSidebar();

  return (
    <aside 
      className={`flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out h-full ${
        isOpen ? "w-72" : "w-20"
      }`}
    >


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
                  ${isOpen ? "px-4 justify-between" : "px-0 justify-center"}
                  py-6
                  text-base
                  transition-all
                  duration-300
                  ease-out
                  animate-fade-in-up
                  ${
                    isActive
                      ? "bg-white/15 text-white shadow-lg shadow-black/5"
                      : "text-white/70 hover:bg-white/10 hover:text-white"
                  }
                `}
                style={{ animationDelay: `${index * 60}ms` }}
              >
                {isActive && (
                  <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-white" />
                )}

                <div className={`flex items-center ${isOpen ? "gap-3.5" : "justify-center"}`}>
                  <item.icon
                    className={`h-[22px] w-[22px] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 ${
                      isActive ? "text-white" : ""
                    }`}
                  />
                  {isOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                </div>

                {isOpen && <ChevronRight className="h-4 w-4 shrink-0 opacity-30 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />}
              </Button>
            </Link>
          );
        })}
      </nav>


    </aside>
  );
}