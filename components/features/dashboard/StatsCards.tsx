"use client";

import { useContent } from "@/lib/content-store";
import StatCard from "./StatCard";
import { FolderKanban, CheckCircle2, FileText, Zap } from "lucide-react";

export default function StatsCards() {
  const { stats, isLoaded } = useContent();

  if (!isLoaded) return null;

  const cards = [
    {
      title: "Total Generations",
      value: stats.totalGenerations.toLocaleString(),
      change: `${stats.thisWeek} this week`,
      trend: stats.thisWeek > 0 ? ("up" as const) : ("neutral" as const),
      icon: <FolderKanban className="h-7 w-7" />,
    },
    {
      title: "Completed",
      value: stats.completed.toLocaleString(),
      change: `${stats.drafts} drafts pending`,
      trend: stats.completed > 0 ? ("up" as const) : ("neutral" as const),
      icon: <CheckCircle2 className="h-7 w-7" />,
    },
    {
      title: "Templates Used",
      value: stats.templatesUsed.toLocaleString(),
      change: `${stats.totalGenerations} total uses`,
      trend: stats.templatesUsed > 0 ? ("up" as const) : ("neutral" as const),
      icon: <FileText className="h-7 w-7" />,
    },
    {
      title: "Total Words",
      value: stats.totalWords.toLocaleString(),
      change: `${stats.thisWeek} generations this week`,
      trend: stats.totalWords > 0 ? ("up" as const) : ("neutral" as const),
      icon: <Zap className="h-7 w-7" />,
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
          />
        ))}
      </div>
    </section>
  );
}