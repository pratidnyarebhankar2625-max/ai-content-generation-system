import StatCard from "./StatCard";
import { FolderKanban, Bot, FileText, Zap } from "lucide-react";

const stats = [
  {
    title: "Total Projects",
    value: "24",
    change: "+3 this week",
    icon: <FolderKanban className="h-8 w-8 text-primary" />,
  },
  {
    title: "AI Generations",
    value: "152",
    change: "+18 today",
    icon: <Bot className="h-8 w-8 text-primary" />,
  },
  {
    title: "Templates Used",
    value: "18",
    change: "+2 this month",
    icon: <FileText className="h-8 w-8 text-primary" />,
  },
  {
    title: "Active Projects",
    value: "7",
    change: "Currently active",
    icon: <Zap className="h-8 w-8 text-primary" />,
  },
];


export default function StatsCards() {
  return (
    <section className="mb-10">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            icon={stat.icon}
          />
        ))}
      </div>
    </section>
  );
}