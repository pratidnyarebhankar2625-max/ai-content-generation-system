"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useDashboard } from "@/lib/dashboard-store";
import SkeletonCard from "./SkeletonCard";
import { useRouter } from "next/navigation";

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
    <section className="animate-fade-in-up">
      <div className="relative overflow-hidden rounded-[20px] bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] p-10 shadow-[var(--shadow-elevated)]">
        {/* Decorative gold accent */}
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4A843]/10 blur-3xl" />
        <div className="absolute -left-6 -bottom-6 h-32 w-32 rounded-full bg-[#B8860B]/8 blur-2xl" />

        <div className="relative flex items-center justify-between">
          <div className="space-y-4">
            <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-[#FAF8F5]">
              {data.greeting}, {data.userName}!
            </h1>

            <div className="flex items-center gap-4">
              <p className="max-w-2xl text-lg text-[#87817B]">
                Create amazing AI content faster with your personal AI assistant.
              </p>

              {/* Refresh indicator */}
              <button
                onClick={refresh}
                className="group flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs text-[#A8A29E] transition-all duration-300 hover:bg-[#292524] hover:text-[#D4A843]"
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
            className="rounded-2xl bg-gradient-to-r from-[#D4A843] to-[#B8860B] px-8 py-3 text-[#1C1917] font-semibold shadow-lg shadow-[#D4A843]/20 transition-all duration-400 hover:shadow-xl hover:shadow-[#D4A843]/30 hover:scale-[1.03]"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Create Content
          </Button>
        </div>
      </div>
    </section>
  );
}