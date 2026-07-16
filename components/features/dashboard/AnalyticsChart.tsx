"use client";

import { useDashboard } from "@/lib/dashboard-store";
import { SkeletonChartsRow } from "./SkeletonCard";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, PieChart as PieChartIcon } from "lucide-react";

// ─── Custom Tooltip for Area Chart ───────────────────────────────────────────

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { words: number } }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-bold text-foreground">
        {payload[0].value} <span className="text-sm font-normal text-muted-foreground">generations</span>
      </p>
      <p className="text-xs text-[#D4A843]">
        {payload[0].payload.words.toLocaleString()} words
      </p>
    </div>
  );
}

// ─── Custom Tooltip for Pie Chart ────────────────────────────────────────────

function PieTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: { color: string } }>;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-xl">
      <div className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: payload[0].payload.color }}
        />
        <p className="text-sm font-medium text-foreground">{payload[0].name}</p>
      </div>
      <p className="mt-1 text-lg font-bold text-foreground">
        {payload[0].value} <span className="text-sm font-normal text-muted-foreground">items</span>
      </p>
    </div>
  );
}

// ─── Analytics Chart Component ───────────────────────────────────────────────

export default function AnalyticsChart() {
  const { data, isLoading } = useDashboard();

  if (isLoading || !data) {
    return <SkeletonChartsRow />;
  }

  const { weeklyData, categoryBreakdown } = data;

  // If no data at all, show empty state
  const hasData = weeklyData.some((d) => d.count > 0);

  return (
    <section className="animate-fade-in-up" style={{ animationDelay: "300ms" }}>
      <h2 className="mb-8 font-heading text-[28px] font-bold tracking-tight">
        Analytics
      </h2>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* ── Area Chart: Generation Trend ──────────────────────────────── */}
        <div className="card-shimmer gold-glow lg:col-span-3 rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:border-[#D4A843]/30">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center rounded-2xl bg-[#D4A843]/8 p-2.5 text-[#B8860B]">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Generation Trend
                </h3>
                <p className="text-xs text-muted-foreground">Last 7 days</p>
              </div>
            </div>

            {hasData && (
              <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                <TrendingUp className="h-3 w-3" />
                {data.thisWeek} this week
              </div>
            )}
          </div>

          {hasData ? (
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={weeklyData}
                  margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#D4A843" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#D4A843" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#E7E0D8"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    dy={8}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#78716C" }}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#D4A843"
                    strokeWidth={2.5}
                    fill="url(#goldGradient)"
                    dot={{
                      r: 4,
                      fill: "#FFFDF9",
                      stroke: "#D4A843",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 6,
                      fill: "#D4A843",
                      stroke: "#FFFDF9",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[260px] items-center justify-center">
              <div className="text-center">
                <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No activity this week
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Donut Chart: Category Breakdown ──────────────────────────── */}
        <div className="card-shimmer gold-glow lg:col-span-2 rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:border-[#D4A843]/30">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center rounded-2xl bg-[#D4A843]/8 p-2.5 text-[#B8860B]">
              <PieChartIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Content Mix
              </h3>
              <p className="text-xs text-muted-foreground">By category</p>
            </div>
          </div>

          {categoryBreakdown.length > 0 ? (
            <>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={3}
                      dataKey="value"
                      stroke="none"
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Legend */}
              <div className="mt-4 space-y-2.5">
                {categoryBreakdown.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-muted-foreground">
                        {item.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-[260px] items-center justify-center">
              <div className="text-center">
                <PieChartIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No content yet
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
