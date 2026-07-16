// ─── Skeleton Loading Components ─────────────────────────────────────────────
// Reusable skeleton variants matching dashboard card dimensions

type SkeletonCardProps = {
  variant?: "stat" | "chart" | "activity" | "project" | "welcome";
  index?: number;
};

export default function SkeletonCard({
  variant = "stat",
  index = 0,
}: SkeletonCardProps) {
  const delay = `${(index + 1) * 80}ms`;

  if (variant === "welcome") {
    return (
      <div
        className="animate-fade-in-up rounded-[20px] bg-gradient-to-r from-[#1C1917] via-[#292524] to-[#1C1917] p-10"
        style={{ animationDelay: delay }}
      >
        <div className="flex items-center justify-between">
          <div className="space-y-4 flex-1">
            <div className="skeleton skeleton-heading w-[340px] h-[48px]" />
            <div className="skeleton skeleton-text w-[400px] opacity-40" />
          </div>
          <div className="skeleton h-[48px] w-[180px] rounded-2xl" />
        </div>
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div
        className="rounded-[20px] border border-border bg-card p-7 animate-fade-in-up"
        style={{ animationDelay: delay }}
      >
        {/* Icon placeholder */}
        <div className="skeleton h-[52px] w-[52px] rounded-2xl" />

        {/* Title */}
        <div className="skeleton skeleton-text mt-5 w-24" />

        {/* Value */}
        <div className="skeleton skeleton-heading mt-3 w-20" />

        {/* Trend */}
        <div className="skeleton skeleton-text mt-4 w-28" />

        {/* Sparkline placeholder */}
        <div className="skeleton mt-4 h-[40px] w-full rounded-lg" />
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div
        className="rounded-[20px] border border-border bg-card p-7 animate-fade-in-up"
        style={{ animationDelay: delay }}
      >
        {/* Chart header */}
        <div className="flex items-center justify-between mb-6">
          <div className="skeleton skeleton-heading w-40" />
          <div className="skeleton skeleton-text w-20" />
        </div>

        {/* Chart area placeholder */}
        <div className="skeleton h-[260px] w-full rounded-xl" />
      </div>
    );
  }

  if (variant === "activity") {
    return (
      <div
        className="flex items-start gap-4 py-4 animate-fade-in-up"
        style={{ animationDelay: delay }}
      >
        {/* Timeline dot */}
        <div className="skeleton h-10 w-10 rounded-full flex-shrink-0" />

        {/* Content */}
        <div className="flex-1 space-y-2">
          <div className="skeleton skeleton-text w-3/4" />
          <div className="skeleton skeleton-text w-1/2 opacity-60" />
        </div>

        {/* Timestamp */}
        <div className="skeleton skeleton-text w-16 flex-shrink-0" />
      </div>
    );
  }

  if (variant === "project") {
    return (
      <div
        className="flex items-center justify-between rounded-[20px] border border-border bg-card p-6 animate-fade-in-up"
        style={{ animationDelay: delay }}
      >
        <div className="space-y-2 flex-1">
          <div className="skeleton skeleton-text w-48" />
          <div className="skeleton skeleton-text w-32 opacity-60" />
        </div>
        <div className="flex items-center gap-4">
          <div className="skeleton h-7 w-24 rounded-full" />
          <div className="skeleton h-5 w-5 rounded" />
        </div>
      </div>
    );
  }

  return null;
}

// ─── Skeleton Groups ─────────────────────────────────────────────────────────

export function SkeletonStatsGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} variant="stat" index={i} />
      ))}
    </div>
  );
}

export function SkeletonChartsRow() {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <SkeletonCard variant="chart" index={0} />
      </div>
      <div className="lg:col-span-2">
        <SkeletonCard variant="chart" index={1} />
      </div>
    </div>
  );
}

export function SkeletonActivityFeed() {
  return (
    <div className="rounded-[20px] border border-border bg-card p-7 animate-fade-in-up">
      <div className="skeleton skeleton-heading w-36 mb-6" />
      <div className="divide-y divide-border">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonCard key={i} variant="activity" index={i} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonProjectsList() {
  return (
    <div className="space-y-4">
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} variant="project" index={i} />
      ))}
    </div>
  );
}
