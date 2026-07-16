"use client";

import Link from "next/link";
import { useDashboard } from "@/lib/dashboard-store";
import { SkeletonActivityFeed } from "./SkeletonCard";
import {
  CheckCircle2,
  Pencil,
  AlertCircle,
  Zap,
  ArrowRight,
  Clock,
} from "lucide-react";

// ─── Activity Icon Config ────────────────────────────────────────────────────

const activityConfig: Record<
  string,
  { icon: React.ReactNode; bgClass: string; ringClass: string }
> = {
  completed: {
    icon: <CheckCircle2 className="h-4 w-4" />,
    bgClass: "bg-emerald-100 text-emerald-600",
    ringClass: "ring-emerald-200",
  },
  draft: {
    icon: <Pencil className="h-4 w-4" />,
    bgClass: "bg-amber-100 text-amber-600",
    ringClass: "ring-amber-200",
  },
  failed: {
    icon: <AlertCircle className="h-4 w-4" />,
    bgClass: "bg-red-100 text-red-500",
    ringClass: "ring-red-200",
  },
};

const defaultConfig = {
  icon: <Zap className="h-4 w-4" />,
  bgClass: "bg-[#D4A843]/10 text-[#B8860B]",
  ringClass: "ring-[#D4A843]/20",
};

// ─── Activity Feed Component ─────────────────────────────────────────────────

export default function ActivityFeed() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <SkeletonActivityFeed />;
  }

  const { recentActivity } = data;

  return (
    <div className="card-shimmer gold-glow rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:border-[#D4A843]/30 animate-fade-in-up" style={{ animationDelay: "400ms" }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center justify-center rounded-2xl bg-[#D4A843]/8 p-2.5 text-[#B8860B]">
            <Clock className="h-5 w-5" />
          </div>
          <h3 className="text-lg font-semibold text-foreground">
            Recent Activity
          </h3>
        </div>

        <Link
          href="/history"
          className="group flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#B8860B] transition-all duration-300 hover:bg-[#D4A843]/8"
        >
          View all
          <ArrowRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Activity List */}
      {recentActivity.length > 0 ? (
        <div className="activity-timeline">
          {recentActivity.map((item, index) => {
            const config = activityConfig[item.status] || defaultConfig;

            return (
              <div
                key={item.id}
                className="activity-item group flex items-start gap-4 py-4 animate-fade-in-up"
                style={{ animationDelay: `${(index + 5) * 60}ms` }}
              >
                {/* Icon */}
                <div
                  className={`activity-dot flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ring-2 ${config.bgClass} ${config.ringClass} transition-all duration-300 group-hover:scale-110`}
                >
                  {config.icon}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground leading-snug truncate">
                    {item.description}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {item.template}
                  </p>
                </div>

                {/* Timestamp */}
                <span className="flex-shrink-0 text-xs text-muted-foreground/70 pt-0.5">
                  {item.time}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12">
          <Clock className="h-10 w-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            No activity yet. Start generating content!
          </p>
        </div>
      )}
    </div>
  );
}
