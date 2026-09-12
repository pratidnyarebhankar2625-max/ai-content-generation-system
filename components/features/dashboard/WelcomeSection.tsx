"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-store";
import SkeletonCard from "./SkeletonCard";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function WelcomeSection() {
  const { data, isLoading, isRefreshing, refresh } = useDashboard();
  const router = useRouter();

  if (isLoading || !data) {
    return (
      <section>
        <SkeletonCard variant="welcome" />
      </section>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#113680] to-[#fe4443] p-5 sm:p-8 md:p-10 shadow-[var(--shadow-elevated)] border border-transparent">
        {/* Decorative accent */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#fe4443]/20 blur-3xl" />
        <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-4">
          <div className="space-y-3 sm:space-y-4">
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-tight text-white break-words">
              {data.greeting}, {data.userName}!
            </h1>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <p className="text-sm sm:text-base md:text-lg leading-relaxed text-white/90">
                Create amazing content faster with Writeora.
              </p>

              {/* Refresh indicator */}
              <button
                onClick={refresh}
                className="group flex items-center gap-2 rounded-xl px-2.5 py-1 text-xs text-white/70 transition-colors duration-300 hover:bg-white/10 hover:text-white"
                title="Refresh dashboard"
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 transition-transform duration-500 ${
                    isRefreshing ? "animate-spin" : "group-hover:rotate-45"
                  }`}
                />
                <span className="hidden sm:inline">
                  {isRefreshing
                    ? "Refreshing..."
                    : `Updated ${data.lastRefreshed.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`}
                </span>

                {/* Live pulse dot */}
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
              </button>
            </div>
          </div>

          <Button
            size="lg"
            onClick={() => router.push("/templates")}
            className="w-full sm:w-auto shrink-0 rounded-2xl bg-white px-6 py-3 text-sm sm:text-base font-bold text-[#113680] shadow-lg shadow-black/5 hover:bg-white/95"
          >
            <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
            Create Content
          </Button>
        </div>
      </div>
    </motion.section>
  );
}