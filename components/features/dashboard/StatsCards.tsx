"use client";

import { useDashboard } from "@/lib/dashboard-store";
import StatCard from "./StatCard";
import { SkeletonStatsGrid } from "./SkeletonCard";
import { FolderKanban, CheckCircle2, FileText, Zap } from "lucide-react";

export default function StatsCards() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return (
      <section>
        <SkeletonStatsGrid />
      </section>
    );
  }

  const cards = [
    {
      title: "Total Generations",
      value: data.totalGenerations,
      change: `${data.thisWeek} this week`,
      trend: data.thisWeek > 0 ? ("up" as const) : ("neutral" as const),
      icon: <FolderKanban className="h-7 w-7" />,
      sparklineData: data.generationsTrend,
    },
    {
      title: "Completed",
      value: data.completed,
      change: `${data.drafts} drafts pending`,
      trend: data.completed > 0 ? ("up" as const) : ("neutral" as const),
      icon: <CheckCircle2 className="h-7 w-7" />,
      sparklineData: data.completedTrend,
    },
    {
      title: "Templates Used",
      value: data.templatesUsed,
      change: `${data.totalGenerations} total uses`,
      trend: data.templatesUsed > 0 ? ("up" as const) : ("neutral" as const),
      icon: <FileText className="h-7 w-7" />,
      sparklineData: data.templatesTrend,
    },
    {
      title: "Total Words",
      value: data.totalWords,
      change: `${data.thisWeek} generations this week`,
      trend: data.totalWords > 0 ? ("up" as const) : ("neutral" as const),
      icon: <Zap className="h-7 w-7" />,
      sparklineData: data.wordsTrend,
    },
  ];

  return (
    <section>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((stat, index) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            trend={stat.trend}
            icon={stat.icon}
            index={index}
            sparklineData={stat.sparklineData}
          />
        ))}
      </div>
    </section>
  );
}