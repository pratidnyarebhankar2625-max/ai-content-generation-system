"use client";

import { TrendingUp, Minus } from "lucide-react";
import { useEffect, useState } from "react";
import { useSpring, useTransform, motion } from "framer-motion";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

type StatCardProps = {
  title: string;
  value: number;
  change: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  index?: number;
  loading?: boolean;
  sparklineData?: number[];
  onClick?: () => void;
};

// ─── Animated Counter ────────────────────────────────────────────────────────

function useAnimatedNumber(target: number): number {
  const [current, setCurrent] = useState(0);
  const springValue = useSpring(0, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    springValue.set(target);
  }, [target, springValue]);

  useEffect(() => {
    return springValue.on("change", (latest) => {
      setCurrent(Math.round(latest));
    });
  }, [springValue]);

  return current;
}

// ─── Sparkline Mini Chart ────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, i) => ({ v: value, i }));

  return (
    <div className="mt-3 h-[32px] sm:h-[40px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#113680" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#113680" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#113680"
            strokeWidth={1.5}
            fill="url(#sparkGrad)"
            dot={false}
            isAnimationActive={true}
            animationDuration={1200}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── StatCard Component ──────────────────────────────────────────────────────

export default function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  index = 0,
  sparklineData,
  onClick,
}: StatCardProps) {
  const animatedValue = useAnimatedNumber(value);

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -6, boxShadow: "0px 10px 30px rgba(17,54,128,0.08)" }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={`card-shimmer primary-glow rounded-[20px] border border-border bg-card p-4 sm:p-6 md:p-7 ${onClick ? "cursor-pointer" : ""}`}
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center rounded-2xl bg-[#113680]/10 p-2 sm:p-3 text-[#113680]">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mt-3 sm:mt-5 text-xs sm:text-sm font-medium text-muted-foreground">
        {title}
      </h3>

      {/* Animated Value */}
      <h2 className="mt-1 sm:mt-2 font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-none text-foreground">
        {animatedValue.toLocaleString()}
      </h2>

      {/* Trend */}
      <div className="mt-2.5 sm:mt-3 flex items-center gap-1.5">
        {trend === "up" ? (
          <div className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
            <TrendingUp className="h-3 w-3" />
            {change}
          </div>
        ) : (
          <div className="flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-muted-foreground">
            <Minus className="h-3 w-3" />
            {change}
          </div>
        )}
      </div>

      {/* Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <Sparkline data={sparklineData} />
      )}
    </motion.div>
  );
}