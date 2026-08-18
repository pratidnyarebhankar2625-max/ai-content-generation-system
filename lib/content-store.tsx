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
import { useAuth } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export type GenerationStatus = "completed" | "draft" | "failed";

export type Generation = {
  id: string; // UUID or client ID
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
  pendingDrafts: number;
  failed: number;
  totalWords: number;
  templatesUsed: number;
  thisWeek: number;
  thisWeekWords: number;
};

export type RecentActivityItem = {
  id: string;
  action: string;
  template: string;
  time: string;
};

type ContentContextType = {
  generations: Generation[];
  stats: ContentStats;
  recentActivity: RecentActivityItem[];
  addGeneration: (gen: Omit<Generation, "id" | "createdAt">) => Promise<string | undefined>;
  updateGeneration: (id: string, updates: Partial<Omit<Generation, "id">>) => Promise<void>;
  deleteGeneration: (id: string) => Promise<void>;
  getGeneration: (id: string) => Generation | undefined;
  importGeneration: (gen: Omit<Generation, "id" | "createdAt"> & { createdAt?: string }) => Promise<void>;
  restoreLastDeleted: () => Promise<boolean>;
  lastDeleted: Generation | null;
  isLoaded: boolean;
  refreshGenerations: () => Promise<void>;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function formatRelativeTime(dateStr: string): string {
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

export function formatNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "m";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return num.toString();
}

function computeStats(generations: Generation[]): ContentStats {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const draftsCount = generations.filter((g) => g.status === "draft").length;

  return {
    totalGenerations: generations.length,
    completed: generations.filter((g) => g.status === "completed").length,
    drafts: draftsCount,
    pendingDrafts: draftsCount,
    failed: generations.filter((g) => g.status === "failed").length,
    totalWords: generations.reduce((sum, g) => sum + (g.wordCount || 0), 0),
    templatesUsed: new Set(generations.map((g) => g.template)).size,
    thisWeek: generations.filter((g) => new Date(g.createdAt) >= weekAgo).length,
    thisWeekWords: generations
      .filter((g) => new Date(g.createdAt) >= weekAgo)
      .reduce((sum, g) => sum + (g.wordCount || 0), 0),
  };
}

function computeRecentActivity(generations: Generation[]): RecentActivityItem[] {
  return [...generations]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((gen) => {
      let action = "Generated content";
      if (gen.status === "draft") action = "Saved draft";
      else if (gen.status === "failed") action = "Generation failed";
      else action = `Generated ${gen.category ? gen.category.toLowerCase() : "ai"} content`;

      return {
        id: gen.id,
        action,
        template: gen.template,
        time: formatRelativeTime(gen.createdAt),
      };
    });
}

// Map from API record to Generation
function mapRowToGeneration(row: any): Generation {
  return {
    id: row.id,
    title: row.title || "Untitled",
    template: row.template || "Custom Template",
    category: row.category || "General",
    status: (row.status || "completed") as GenerationStatus,
    wordCount: Number(row.word_count ?? row.wordCount) || 0,
    preview: row.preview || "",
    createdAt: row.created_at ?? row.createdAt ?? new Date().toISOString(),
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<Generation | null>(null);
  
  const { user, isAuthenticated } = useAuth();

  const fetchGenerations = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setGenerations([]);
      setIsLoaded(true);
      return;
    }

    try {
      const res = await fetch("/api/history?limit=100", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        console.warn("Could not load generations from API:", res.statusText);
      } else {
        const json = await res.json();
        if (json.success && json.data?.items) {
          setGenerations(json.data.items.map(mapRowToGeneration));
        }
      }
    } catch (err: any) {
      console.warn("Network or server error fetching generations:", err?.message || err);
    } finally {
      setIsLoaded(true);
    }
  }, [isAuthenticated, user]);

  // Load from API on mount or auth change
  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const addGeneration = useCallback(
    async (gen: Omit<Generation, "id" | "createdAt">): Promise<string | undefined> => {
      const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
      const optimisticGen: Generation = {
        ...gen,
        id: tempId || `gen-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };

      // Optimistic local update for responsive UI
      setGenerations((prev) => [optimisticGen, ...prev]);

      if (!user) return optimisticGen.id;

      const payload = {
        id: tempId,
        title: gen.title,
        template: gen.template,
        category: gen.category,
        status: gen.status,
        preview: gen.preview,
        word_count: gen.wordCount,
      };

      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const msg = errJson.error?.message || "Failed to persist generation";
          console.error("Failed to persist generation via API:", msg);
          throw new Error(msg);
        }

        const json = await res.json();
        if (json.success && json.data) {
          const mapped = mapRowToGeneration(json.data);
          setGenerations((prev) => prev.map((g) => (g.id === optimisticGen.id ? mapped : g)));
          return mapped.id;
        }
      } catch (err: any) {
        console.error("Error adding generation:", err.message);
        throw err;
      }

      return optimisticGen.id;
    },
    [user]
  );

  const updateGeneration = useCallback(
    async (id: string, updates: Partial<Omit<Generation, "id">>) => {
      // Optimistic local update
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );

      if (!user) return;

      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title;
      if (updates.template !== undefined) payload.template = updates.template;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.preview !== undefined) payload.preview = updates.preview;
      if (updates.wordCount !== undefined) payload.word_count = updates.wordCount;
      if (updates.createdAt !== undefined) payload.created_at = updates.createdAt;

      try {
        const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const msg = errJson.error?.message || "Failed to update generation";
          console.error("Failed to update generation via API:", msg);
          throw new Error(msg);
        }

        const json = await res.json();
        if (json.success && json.data) {
          const mapped = mapRowToGeneration(json.data);
          setGenerations((prev) => prev.map((g) => (g.id === id ? mapped : g)));
        }
      } catch (err: any) {
        console.error("Error updating generation:", err.message);
        throw err;
      }
    },
    [user]
  );

  const deleteGeneration = useCallback(
    async (id: string) => {
      const target = generations.find((g) => g.id === id);
      if (target) {
        setLastDeleted(target);
      }

      // Optimistic local removal
      setGenerations((prev) => prev.filter((g) => g.id !== id));
      
      if (!user) return;

      try {
        const res = await fetch(`/api/history/${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const msg = errJson.error?.message || "Failed to delete generation";
          console.error("Failed to delete generation via API:", msg);
          // Rollback optimistic removal
          if (target) {
            setGenerations((prev) => [target, ...prev]);
          }
          throw new Error(msg);
        }
      } catch (err: any) {
        if (target) {
          setGenerations((prev) => [target, ...prev]);
        }
        throw err;
      }
    },
    [generations, user]
  );

  const importGeneration = useCallback(
    async (gen: Omit<Generation, "id" | "createdAt"> & { createdAt?: string }) => {
      const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : undefined;
      const optimisticGen: Generation = {
        ...gen,
        id: tempId || `gen-${Date.now()}`,
        createdAt: gen.createdAt || new Date().toISOString(),
      };

      setGenerations((prev) => [optimisticGen, ...prev]);

      if (!user) return;
      
      const payload: any = {
        id: tempId,
        title: gen.title,
        template: gen.template,
        category: gen.category,
        status: gen.status,
        preview: gen.preview,
        word_count: gen.wordCount,
      };
      
      if (gen.createdAt) {
        payload.created_at = gen.createdAt;
      }

      try {
        const res = await fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const errJson = await res.json().catch(() => ({}));
          const msg = errJson.error?.message || "Failed to import generation";
          console.error("Failed to import generation via API:", msg);
          setGenerations((prev) => prev.filter((g) => g.id !== optimisticGen.id));
          throw new Error(msg);
        }

        const json = await res.json();
        if (json.success && json.data) {
          const mapped = mapRowToGeneration(json.data);
          setGenerations((prev) => prev.map((g) => (g.id === optimisticGen.id ? mapped : g)));
        }
      } catch (err: any) {
        setGenerations((prev) => prev.filter((g) => g.id !== optimisticGen.id));
        throw err;
      }
    },
    [user]
  );

  const restoreLastDeleted = useCallback(async () => {
    if (!lastDeleted) return false;
    
    const restored = lastDeleted;
    setGenerations((prev) => [restored, ...prev]);
    setLastDeleted(null);

    if (!user) return true;

    const payload = {
      id: restored.id,
      title: restored.title,
      template: restored.template,
      category: restored.category,
      status: restored.status,
      preview: restored.preview,
      word_count: restored.wordCount,
      created_at: restored.createdAt,
    };

    try {
      const res = await fetch("/api/history/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        console.error("Failed to restore generation via API");
        return false;
      }

      const json = await res.json();
      if (json.success && json.data) {
        const mapped = mapRowToGeneration(json.data);
        setGenerations((prev) => prev.map((g) => (g.id === restored.id ? mapped : g)));
      }

      return true;
    } catch (err) {
      console.error("Error restoring generation:", err);
      return false;
    }
  }, [lastDeleted, user]);

  const getGeneration = useCallback(
    (id: string) => {
      return generations.find((g) => g.id === id);
    },
    [generations]
  );

  const stats = useMemo(() => computeStats(generations), [generations]);
  const recentActivity = useMemo(() => computeRecentActivity(generations), [generations]);

  const value = useMemo<ContentContextType>(
    () => ({
      generations,
      stats,
      recentActivity,
      addGeneration,
      updateGeneration,
      deleteGeneration,
      getGeneration,
      importGeneration,
      restoreLastDeleted,
      lastDeleted,
      isLoaded,
      refreshGenerations: fetchGenerations,
    }),
    [
      generations,
      stats,
      recentActivity,
      addGeneration,
      updateGeneration,
      deleteGeneration,
      getGeneration,
      importGeneration,
      restoreLastDeleted,
      lastDeleted,
      isLoaded,
      fetchGenerations,
    ]
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContent(): ContentContextType {
  const context = useContext(ContentContext);
  if (!context) {
    throw new Error("useContent must be used within a ContentProvider");
  }
  return context;
}

