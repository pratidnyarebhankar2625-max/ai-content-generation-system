import StatCard from "./StatCard";
import { FolderKanban, Bot, FileText, Zap } from "lucide-react";

const stats = [
  {
    title: "Total Projects",
    value: "24",
    change: "+12% this week",
    trend: "up" as const,
    icon: <FolderKanban className="h-7 w-7" />,
  },
  {
    title: "AI Generations",
    value: "152",
    change: "+18% today",
    trend: "up" as const,
    icon: <Bot className="h-7 w-7" />,
  },
  {
    title: "Templates Used",
    value: "18",
    change: "+8% this month",
    trend: "up" as const,
    icon: <FileText className="h-7 w-7" />,
  },
  {
    title: "Active Projects",
    value: "7",
    change: "Currently active",
    trend: "neutral" as const,
    icon: <Zap className="h-7 w-7" />,
  },
];


export default function StatsCards() {
  return (
    <section>
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
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