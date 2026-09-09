"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSidebar } from "@/lib/sidebar-store";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  History,
  Settings,
  User,
  Search,
  ChevronRight,
} from "lucide-react";
import { motion, Variants } from "framer-motion";

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
    name: "SEO Assistant",
    icon: Search,
    href: "/seo",
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
  const { isOpen, toggleSidebar } = useSidebar();

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
      }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, x: -8 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.15, ease: "easeOut" } }
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden animate-in fade-in"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ease-in-out h-full ${
          isOpen ? "translate-x-0 w-[85vw] max-w-sm lg:w-72" : "-translate-x-full lg:translate-x-0 lg:w-20"
        }`}
      >
        {/* Navigation */}
        <motion.nav 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex-1 space-y-2 px-4 py-6 overflow-y-auto"
        >
          {menuItems.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);

            return (
              <motion.div key={item.name} variants={itemVariants}>
                <Link
                  href={item.href}
                  prefetch={true}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      toggleSidebar();
                    }
                  }}
                >
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
                      ${
                        isActive
                          ? "bg-primary/10 text-primary shadow-sm"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }
                    `}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2.5 bottom-2.5 w-1.5 rounded-r-full bg-primary" />
                    )}

                    <div className={`flex items-center ${isOpen ? "gap-3.5" : "justify-center"}`}>
                      <item.icon
                        className={`h-[22px] w-[22px] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 ${
                          isActive ? "text-primary" : ""
                        }`}
                      />
                      {isOpen && <span className="font-medium whitespace-nowrap">{item.name}</span>}
                    </div>

                    {isOpen && <ChevronRight className="h-4 w-4 shrink-0 opacity-30 transition-all duration-300 group-hover:translate-x-1 group-hover:opacity-100" />}
                  </Button>
                </Link>
              </motion.div>
            );
          })}
        </motion.nav>
      </aside>
    </>
  );
}