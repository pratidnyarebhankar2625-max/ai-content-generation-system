"use client";

import { useDashboard } from "@/lib/dashboard-store";
import { SkeletonChartsRow } from "./SkeletonCard";
import {
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";

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

      <div className="grid gap-6 grid-cols-1">
        {/* ── Donut Chart: Category Breakdown ──────────────────────────── */}
        <div className="card-shimmer primary-glow rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:border-[#567C8D]/30 min-h-[300px]">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center rounded-2xl bg-[#567C8D]/8 p-2.5 text-[#567C8D]">
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
