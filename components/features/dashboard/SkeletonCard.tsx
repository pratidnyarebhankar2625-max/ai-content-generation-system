// ─── Skeleton Loading Components ─────────────────────────────────────────────
// Reusable skeleton variants matching dashboard card dimensions

import { motion } from "framer-motion";

type SkeletonCardProps = {
  variant?: "stat" | "chart" | "activity" | "project" | "welcome";
  index?: number;
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } }
};

export default function SkeletonCard({
  variant = "stat",
  index = 0,
}: SkeletonCardProps) {
  if (variant === "welcome") {
    return (
      <motion.div
        variants={itemVariants}
        className="rounded-[20px] bg-gradient-to-r from-primary/80 to-secondary/80 p-10 relative overflow-hidden"
      >
        <motion.div 
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent"
          animate={{ x: ["100%", "-100%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        <div className="flex items-center justify-between relative z-10">
          <div className="space-y-4 flex-1">
            <div className="h-[48px] w-[340px] rounded-lg bg-white/20" />
            <div className="h-[24px] w-[400px] rounded-lg bg-white/10" />
          </div>
          <div className="h-[48px] w-[180px] rounded-2xl bg-white/20" />
        </div>
      </motion.div>
    );
  }

  if (variant === "stat") {
    return (
      <motion.div
        variants={itemVariants}
        className="rounded-[20px] border border-border bg-card p-7 relative overflow-hidden"
      >
        <motion.div 
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "linear", delay: index * 0.1 }}
        />
        {/* Icon placeholder */}
        <div className="h-[52px] w-[52px] rounded-2xl bg-muted" />

        {/* Title */}
        <div className="mt-5 h-4 w-24 rounded bg-muted" />

        {/* Value */}
        <div className="mt-3 h-10 w-20 rounded bg-muted" />

        {/* Trend */}
        <div className="mt-4 h-4 w-28 rounded bg-muted" />

        {/* Sparkline placeholder */}
        <div className="mt-4 h-[40px] w-full rounded-lg bg-muted" />
      </motion.div>
    );
  }

  if (variant === "chart") {
    return (
      <motion.div
        variants={itemVariants}
        className="rounded-[20px] border border-border bg-card p-7 relative overflow-hidden"
      >
        <motion.div 
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/5 to-transparent"
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        />
        {/* Chart header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-6 w-40 rounded bg-muted" />
          <div className="h-4 w-20 rounded bg-muted" />
        </div>

        {/* Chart area placeholder */}
        <div className="h-[260px] w-full rounded-xl bg-muted" />
      </motion.div>
    );
  }

  if (variant === "activity") {
    return (
      <motion.div
        variants={itemVariants}
        className="flex items-start gap-4 py-4 relative overflow-hidden"
      >
        {/* Timeline dot */}
        <div className="h-10 w-10 rounded-full bg-muted flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-4 w-1/2 rounded bg-muted opacity-60" />
        </div>

        {/* Timestamp */}
        <div className="h-4 w-16 rounded bg-muted flex-shrink-0" />
      </motion.div>
    );
  }

  if (variant === "project") {
    return (
      <motion.div
        variants={itemVariants}
        className="flex items-center justify-between rounded-[20px] border border-border bg-card p-6 relative overflow-hidden"
      >
        <div className="space-y-2 flex-1">
          <div className="h-5 w-48 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted opacity-60" />
        </div>
        <div className="flex items-center gap-4">
          <div className="h-7 w-24 rounded-full bg-muted" />
          <div className="h-5 w-5 rounded bg-muted" />
        </div>
      </motion.div>
    );
  }

  return null;
}

// ─── Skeleton Groups ─────────────────────────────────────────────────────────

import { Variants } from "framer-motion";

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

export function SkeletonStatsGrid() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-6 md:grid-cols-2 xl:grid-cols-4"
    >
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} variant="stat" index={i} />
      ))}
    </motion.div>
  );
}

export function SkeletonChartsRow() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-6 lg:grid-cols-5"
    >
      <div className="lg:col-span-3">
        <SkeletonCard variant="chart" index={0} />
      </div>
      <div className="lg:col-span-2">
        <SkeletonCard variant="chart" index={1} />
      </div>
    </motion.div>
  );
}

export function SkeletonActivityFeed() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="rounded-[20px] border border-border bg-card p-7"
    >
      <div className="h-6 w-36 rounded bg-muted mb-6" />
      <div className="divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} variant="activity" index={i} />
        ))}
      </div>
    </motion.div>
  );
}

export function SkeletonProjectsList() {
  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} variant="project" index={i} />
      ))}
    </motion.div>
  );
}
