
"use client";

import WelcomeSection from "@/components/features/dashboard/WelcomeSection";
import StatsCards from "@/components/features/dashboard/StatsCards";
import AnalyticsChart from "@/components/features/dashboard/AnalyticsChart";
import QuickActions from "@/components/features/dashboard/QuickActions";
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

export default function HomePage() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants}>
        <WelcomeSection />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatsCards />
      </motion.div>
      {/* Two-column layout: Quick Actions + Analytics */}
      <motion.div variants={itemVariants} className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <AnalyticsChart />
        </div>
      </motion.div>
    </motion.div>
  );
}