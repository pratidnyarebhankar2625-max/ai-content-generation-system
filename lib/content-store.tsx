"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GenerationStatus = "completed" | "draft" | "failed";

export type Generation = {
  id: number;
  title: string;
  template: string;
  category: string;
  status: GenerationStatus;
  createdAt: string;
  wordCount: number;
  preview: string;
};

export type ContentStats = {
  totalGenerations: number;
  completed: number;
  drafts: number;
  failed: number;
  totalWords: number;
  templatesUsed: number;
  thisWeek: number;
};

export type RecentActivityItem = {
  id: number;
  action: string;
  template: string;
  time: string;
};

type ContentContextType = {
  generations: Generation[];
  stats: ContentStats;
  recentActivity: RecentActivityItem[];
  addGeneration: (gen: Omit<Generation, "id" | "createdAt">) => void;
  updateGeneration: (id: number, updates: Partial<Omit<Generation, "id">>) => void;
  deleteGeneration: (id: number) => void;
  getGeneration: (id: number) => Generation | undefined;
  isLoaded: boolean;
};

// ─── Seed Data ───────────────────────────────────────────────────────────────
// Used only when localStorage is empty (first visit)

const seedData: Generation[] = [
  {
    id: 1,
    title: "10 Tips for Better Productivity",
    template: "Blog Post Generator",
    category: "Blog Writing",
    status: "completed",
    createdAt: "2025-07-09T14:30:00",
    wordCount: 1250,
    preview:
      "Discover the top 10 productivity tips that will transform your daily routine. From time-blocking techniques to the Pomodoro method...",
  },
  {
    id: 2,
    title: "Summer Sale Announcement",
    template: "Email Campaign",
    category: "Email",
    status: "completed",
    createdAt: "2025-07-08T11:15:00",
    wordCount: 420,
    preview:
      "Get ready for our biggest summer sale yet! Enjoy up to 50% off on selected items. Limited time offer, don't miss out...",
  },
  {
    id: 3,
    title: "New Product Launch Post",
    template: "Instagram Caption",
    category: "Social Media",
    status: "completed",
    createdAt: "2025-07-08T09:45:00",
    wordCount: 180,
    preview:
      "✨ Introducing our latest innovation! We've been working behind the scenes to bring you something truly special...",
  },
  {
    id: 4,
    title: "Q3 Marketing Strategy",
    template: "Marketing Plan",
    category: "Marketing",
    status: "draft",
    createdAt: "2025-07-07T16:20:00",
    wordCount: 2100,
    preview:
      "Our Q3 marketing strategy focuses on expanding our digital presence through targeted campaigns, influencer partnerships...",
  },
  {
    id: 5,
    title: "Employee Welcome Email",
    template: "Professional Email",
    category: "Email",
    status: "completed",
    createdAt: "2025-07-07T10:00:00",
    wordCount: 350,
    preview:
      "Welcome to the team! We're thrilled to have you on board. Here's everything you need to know for your first week...",
  },
  {
    id: 6,
    title: "API Documentation Draft",
    template: "Technical Documentation",
    category: "Developer",
    status: "draft",
    createdAt: "2025-07-06T13:50:00",
    wordCount: 3200,
    preview:
      "REST API Reference v2.0 — This document provides comprehensive documentation for all available endpoints, authentication...",
  },
  {
    id: 7,
    title: "Brand Story Article",
    template: "Blog Post Generator",
    category: "Blog Writing",
    status: "completed",
    createdAt: "2025-07-05T15:30:00",
    wordCount: 1800,
    preview:
      "Every great brand has a story worth telling. Ours began in a small garage with a big dream and an even bigger whiteboard...",
  },
  {
    id: 8,
    title: "Course Introduction Script",
    template: "Educational Content",
    category: "Education",
    status: "failed",
    createdAt: "2025-07-05T08:10:00",
    wordCount: 0,
    preview: "Generation failed — API rate limit exceeded. Please try again later.",
  },
  {
    id: 9,
    title: "LinkedIn Thought Leadership",
    template: "LinkedIn Post",
    category: "Social Media",
    status: "completed",
    createdAt: "2025-07-04T17:45:00",
    wordCount: 290,
    preview:
      "The future of work isn't about replacing humans with AI — it's about augmenting human potential. Here's what I've learned...",
  },
  {
    id: 10,
    title: "AI-Powered Content Workflow",
    template: "AI Summary",
    category: "AI Utility",
    status: "completed",
    createdAt: "2025-07-03T12:00:00",
    wordCount: 600,
    preview:
      "Streamline your content creation with this AI-powered workflow that reduces production time by 60% while maintaining quality...",
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STORAGE_KEY = "ai-content-generations";

function loadFromStorage(): Generation[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(generations: Generation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(generations));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function computeStats(generations: Generation[]): ContentStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  return {
    totalGenerations: generations.length,
    completed: generations.filter((g) => g.status === "completed").length,
    drafts: generations.filter((g) => g.status === "draft").length,
    failed: generations.filter((g) => g.status === "failed").length,
    totalWords: generations.reduce((sum, g) => sum + g.wordCount, 0),
    templatesUsed: new Set(generations.map((g) => g.template)).size,
    thisWeek: generations.filter(
      (g) => new Date(g.createdAt) >= weekAgo
    ).length,
  };
}

function computeRecentActivity(generations: Generation[]): RecentActivityItem[] {
  return [...generations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5)
    .map((gen) => {
      let action = "Generated content";
      if (gen.status === "draft") action = "Saved draft";
      else if (gen.status === "failed") action = "Generation failed";
      else action = `Generated ${gen.category.toLowerCase()} content`;

      return {
        id: gen.id,
        action,
        template: gen.template,
        time: formatRelativeTime(gen.createdAt),
      };
    });
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from storage on mount
  useEffect(() => {
    const stored = loadFromStorage();
    setGenerations(stored ?? seedData);
    setIsLoaded(true);
  }, []);

  // Persist to storage on every change (after initial load)
  useEffect(() => {
    if (isLoaded) {
      saveToStorage(generations);
    }
  }, [generations, isLoaded]);

  const addGeneration = useCallback(
    (gen: Omit<Generation, "id" | "createdAt">) => {
      const newGen: Generation = {
        ...gen,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };
      setGenerations((prev) => [newGen, ...prev]);
    },
    []
  );

  const updateGeneration = useCallback(
    (id: number, updates: Partial<Omit<Generation, "id">>) => {
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );
    },
    []
  );

  const deleteGeneration = useCallback((id: number) => {
    setGenerations((prev) => prev.filter((g) => g.id !== id));
  }, []);

  const getGeneration = useCallback(
    (id: number) => {
      return generations.find((g) => g.id === id);
    },
    [generations]
  );

  const stats = useMemo(() => computeStats(generations), [generations]);
  const recentActivity = useMemo(
    () => computeRecentActivity(generations),
    [generations]
  );

  const value = useMemo<ContentContextType>(
    () => ({
      generations,
      stats,
      recentActivity,
      addGeneration,
      updateGeneration,
      deleteGeneration,
      getGeneration,
      isLoaded,
    }),
    [
      generations,
      stats,
      recentActivity,
      addGeneration,
      updateGeneration,
      deleteGeneration,
      getGeneration,
      isLoaded,
    ]
  );

  return (
    <ContentContext.Provider value={value}>{children}</ContentContext.Provider>
  );
}

export function useContent(): ContentContextType {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
}
