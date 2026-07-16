"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useContent, type Generation } from "@/lib/content-store";
import { useAuth } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export type DailyDataPoint = {
  day: string; // e.g. "Mon", "Tue"
  date: string; // e.g. "Jul 10"
  count: number;
  words: number;
};

export type CategoryBreakdown = {
  name: string;
  value: number;
  color: string;
};

export type EnrichedActivity = {
  id: number;
  action: string;
  description: string;
  template: string;
  category: string;
  status: string;
  time: string;
  timestamp: number;
};

export type DashboardData = {
  // Core stats (from content-store)
  totalGenerations: number;
  completed: number;
  drafts: number;
  failed: number;
  totalWords: number;
  templatesUsed: number;
  thisWeek: number;

  // Sparkline data (7 data points for each stat)
  generationsTrend: number[];
  wordsTrend: number[];
  completedTrend: number[];
  templatesTrend: number[];

  // Charts
  weeklyData: DailyDataPoint[];
  categoryBreakdown: CategoryBreakdown[];

  // Activity
  recentActivity: EnrichedActivity[];

  // User
  userName: string;
  greeting: string;
  lastRefreshed: Date;
};

type DashboardContextType = {
  data: DashboardData | null;
  isLoading: boolean;
  isRefreshing: boolean;
  refresh: () => void;
};

// ─── Category Color Palette ──────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  "Blog Writing": "#D4A843",
  Email: "#B8860B",
  "Social Media": "#8B6914",
  Marketing: "#78716C",
  Developer: "#44403C",
  Education: "#A8A29E",
  "AI Utility": "#1C1917",
};

function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] || "#78716C";
}

// ─── Time-of-Day Greeting ────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

// ─── Compute Weekly Data ─────────────────────────────────────────────────────
// Aggregates generations into 7 daily buckets for the area chart

function computeWeeklyData(generations: Generation[]): DailyDataPoint[] {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  const result: DailyDataPoint[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayGenerations = generations.filter((g) => {
      const created = new Date(g.createdAt);
      return created >= dayStart && created < dayEnd;
    });

    result.push({
      day: days[date.getDay()],
      date: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      count: dayGenerations.length,
      words: dayGenerations.reduce((sum, g) => sum + g.wordCount, 0),
    });
  }

  return result;
}

// ─── Compute Category Breakdown ──────────────────────────────────────────────

function computeCategoryBreakdown(generations: Generation[]): CategoryBreakdown[] {
  const counts: Record<string, number> = {};
  for (const gen of generations) {
    counts[gen.category] = (counts[gen.category] || 0) + 1;
  }

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, value]) => ({
      name,
      value,
      color: getCategoryColor(name),
    }));
}

// ─── Compute Sparklines ──────────────────────────────────────────────────────
// Returns 7 data points showing daily trend for each stat

function computeSparkline(
  generations: Generation[],
  selector: (dayGens: Generation[]) => number
): number[] {
  const now = new Date();
  const result: number[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayGens = generations.filter((g) => {
      const created = new Date(g.createdAt);
      return created >= dayStart && created < dayEnd;
    });

    result.push(selector(dayGens));
  }

  return result;
}

// ─── Compute Activity Feed ───────────────────────────────────────────────────

function computeActivity(generations: Generation[]): EnrichedActivity[] {
  const sorted = [...generations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8);

  return sorted.map((gen) => {
    let action = "Generated";
    let description = `Created ${gen.category.toLowerCase()} content`;

    if (gen.status === "draft") {
      action = "Saved draft";
      description = `Draft saved for "${gen.title}"`;
    } else if (gen.status === "failed") {
      action = "Failed";
      description = `Generation failed for ${gen.template}`;
    } else {
      description = `Generated "${gen.title}" using ${gen.template}`;
    }

    // Relative time
    const diffMs = Date.now() - new Date(gen.createdAt).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    const diffHrs = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let time = "Just now";
    if (diffMin >= 1 && diffMin < 60) time = `${diffMin}m ago`;
    else if (diffHrs >= 1 && diffHrs < 24) time = `${diffHrs}h ago`;
    else if (diffDays === 1) time = "Yesterday";
    else if (diffDays > 1 && diffDays < 7) time = `${diffDays} days ago`;
    else if (diffDays >= 7)
      time = new Date(gen.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });

    return {
      id: gen.id,
      action,
      description,
      template: gen.template,
      category: gen.category,
      status: gen.status,
      time,
      timestamp: new Date(gen.createdAt).getTime(),
    };
  });
}

// ─── Context ─────────────────────────────────────────────────────────────────

const DashboardContext = createContext<DashboardContextType | null>(null);

const AUTO_REFRESH_INTERVAL = 30_000; // 30 seconds
const INITIAL_LOAD_DELAY = 600; // Simulate API delay for skeleton demo

export function DashboardProvider({ children }: { children: ReactNode }) {
  const { generations, stats, isLoaded: contentLoaded } = useContent();
  const { user } = useAuth();

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadDone = useRef(false);

  // ── Compute dashboard data ───────────────────────────────────────────────
  const computeData = useCallback((): DashboardData => {
    return {
      totalGenerations: stats.totalGenerations,
      completed: stats.completed,
      drafts: stats.drafts,
      failed: stats.failed,
      totalWords: stats.totalWords,
      templatesUsed: stats.templatesUsed,
      thisWeek: stats.thisWeek,

      generationsTrend: computeSparkline(generations, (d) => d.length),
      wordsTrend: computeSparkline(generations, (d) =>
        d.reduce((sum, g) => sum + g.wordCount, 0)
      ),
      completedTrend: computeSparkline(
        generations,
        (d) => d.filter((g) => g.status === "completed").length
      ),
      templatesTrend: computeSparkline(
        generations,
        (d) => new Set(d.map((g) => g.template)).size
      ),

      weeklyData: computeWeeklyData(generations),
      categoryBreakdown: computeCategoryBreakdown(generations),
      recentActivity: computeActivity(generations),

      userName: user?.name || "User",
      greeting: getGreeting(),
      lastRefreshed: new Date(),
    };
  }, [generations, stats, user]);

  // ── Initial load with simulated delay ────────────────────────────────────
  useEffect(() => {
    if (!contentLoaded || initialLoadDone.current) return;

    const timeout = setTimeout(() => {
      setData(computeData());
      setIsLoading(false);
      initialLoadDone.current = true;
    }, INITIAL_LOAD_DELAY);

    return () => clearTimeout(timeout);
  }, [contentLoaded, computeData]);

  // ── Live update when content changes (after initial load) ────────────────
  useEffect(() => {
    if (!initialLoadDone.current || !contentLoaded) return;
    setData(computeData());
  }, [generations, stats, computeData, contentLoaded]);

  // ── Auto-refresh ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!initialLoadDone.current) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      // Brief flash to show refresh happened
      setTimeout(() => {
        setData(computeData());
        setIsRefreshing(false);
      }, 300);
    }, AUTO_REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [computeData]);

  // ── Manual refresh ───────────────────────────────────────────────────────
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      setData(computeData());
      setIsRefreshing(false);
    }, 300);
  }, [computeData]);

  const value = useMemo<DashboardContextType>(
    () => ({ data, isLoading, isRefreshing, refresh }),
    [data, isLoading, isRefreshing, refresh]
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useDashboard(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
