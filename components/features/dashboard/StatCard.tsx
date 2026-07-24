"use client";

import { TrendingUp, Minus } from "lucide-react";
import { useEffect, useState, useRef } from "react";
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

function useAnimatedNumber(target: number, duration = 800): number {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const from = prevTarget.current;
    prevTarget.current = target;

    if (from === target) {
      setCurrent(target);
      return;
    }

    startRef.current = null;

    function step(timestamp: number) {
      if (!startRef.current) startRef.current = timestamp;
      const elapsed = timestamp - startRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(from + (target - from) * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    }

    frameRef.current = requestAnimationFrame(step);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [target, duration]);

  return current;
}

// ─── Sparkline Mini Chart ────────────────────────────────────────────────────

function Sparkline({ data }: { data: number[] }) {
  const chartData = data.map((value, i) => ({ v: value, i }));

  return (
    <div className="mt-4 h-[40px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#567C8D" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#567C8D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="#567C8D"
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
    <div
      onClick={onClick}
      className={`card-shimmer primary-glow rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:-translate-y-1.5 hover:border-[#567C8D]/30 animate-fade-in-up ${onClick ? "cursor-pointer" : ""}`}
      style={{ animationDelay: `${(index + 1) * 80}ms` }}
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center rounded-2xl bg-[#567C8D]/8 p-3 text-[#567C8D]">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mt-5 text-sm font-medium text-muted-foreground">
        {title}
      </h3>

      {/* Animated Value */}
      <h2 className="mt-2 font-heading text-[40px] font-bold tracking-tight leading-none text-foreground">
        {animatedValue.toLocaleString()}
      </h2>

      {/* Trend */}
      <div className="mt-3 flex items-center gap-1.5">
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
    </div>
  );
}