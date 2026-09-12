"use client";

import { useDashboard } from "@/lib/dashboard-store";
import StatCard from "./StatCard";
import { SkeletonStatsGrid } from "./SkeletonCard";
import { FolderKanban, CheckCircle2, FileText, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    }
  }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function StatsCards() {
  const { data, isLoading, setFilterStatus } = useDashboard();
  const router = useRouter();

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
      icon: <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6" />,
      sparklineData: data.generationsTrend,
      filterAction: () => setFilterStatus("all"),
    },
    {
      title: "Completed",
      value: data.completed,
      change: `${data.drafts} drafts pending`,
      trend: data.completed > 0 ? ("up" as const) : ("neutral" as const),
      icon: <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6" />,
      sparklineData: data.completedTrend,
      filterAction: () => setFilterStatus("completed"),
    },
    {
      title: "Drafts",
      value: data.drafts,
      change: `${data.drafts} drafts pending`,
      trend: "neutral" as const,
      icon: <FolderKanban className="h-5 w-5 sm:h-6 sm:w-6" />,
      sparklineData: data.generationsTrend,
      filterAction: () => setFilterStatus("draft"),
    },
    {
      title: "Templates Used",
      value: data.templatesUsed,
      change: `${data.templatesUsed} total uses`,
      trend: data.templatesUsed > 0 ? ("up" as const) : ("neutral" as const),
      icon: <FileText className="h-5 w-5 sm:h-6 sm:w-6" />,
      sparklineData: data.templatesTrend,
      filterAction: () => setFilterStatus("all"),
    },
    {
      title: "Total Words",
      value: data.totalWords,
      change: `${data.thisWeek} generations this week`,
      trend: data.totalWords > 0 ? ("up" as const) : ("neutral" as const),
      icon: <Zap className="h-5 w-5 sm:h-6 sm:w-6" />,
      sparklineData: data.wordsTrend,
      filterAction: () => setFilterStatus("all"),
    },
  ];

  return (
    <section>
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 md:gap-6"
      >
        {cards.map((stat, index) => (
          <motion.div key={stat.title} variants={itemVariants}>
            <StatCard
              title={stat.title}
              value={stat.value}
              change={stat.change}
              trend={stat.trend}
              icon={stat.icon}
              index={index}
              sparklineData={stat.sparklineData}
              onClick={() => {
                stat.filterAction();
                router.push('/templates');
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}