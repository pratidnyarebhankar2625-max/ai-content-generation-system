import { TrendingUp, Minus } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string;
  change: string;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
  index?: number;
};

export default function StatCard({
  title,
  value,
  change,
  trend = "neutral",
  icon,
  index = 0,
}: StatCardProps) {
  return (
    <div
      className="card-shimmer gold-glow rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:-translate-y-1.5 hover:border-[#D4A843]/30 animate-fade-in-up"
      style={{ animationDelay: `${(index + 1) * 80}ms` }}
    >
      {/* Icon */}
      <div className="inline-flex items-center justify-center rounded-2xl bg-[#D4A843]/8 p-3 text-[#B8860B]">
        {icon}
      </div>

      {/* Title */}
      <h3 className="mt-5 text-sm font-medium text-muted-foreground">
        {title}
      </h3>

      {/* Value */}
      <h2 className="mt-2 font-heading text-[40px] font-bold tracking-tight leading-none text-foreground">
        {value}
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
    </div>
  );
}