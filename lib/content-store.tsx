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
import { createClient } from "@/lib/supabase/client";
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

// Map from Supabase row to Generation
function mapRowToGeneration(row: any): Generation {
  return {
    id: row.id,
    title: row.title || "Untitled",
    template: row.template || "Custom Template",
    category: row.category || "General",
    status: (row.status || "completed") as GenerationStatus,
    wordCount: Number(row.word_count) || 0,
    preview: row.preview || "",
    createdAt: row.created_at || new Date().toISOString(),
  };
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ContentContext = createContext<ContentContextType | null>(null);

export function ContentProvider({ children }: { children: ReactNode }) {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<Generation | null>(null);
  
  const supabase = createClient();
  const { user, isAuthenticated } = useAuth();

  // Load from Supabase on mount or auth change
  useEffect(() => {
    async function loadData() {
      if (!isAuthenticated || !user) {
        setGenerations([]);
        setIsLoaded(true);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('generations')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          console.warn("Could not load generations from Supabase:", error.message || error);
        } else if (data) {
          setGenerations(data.map(mapRowToGeneration));
        }
      } catch (err: any) {
        console.warn("Network or server error fetching generations:", err?.message || err);
      } finally {
        setIsLoaded(true);
      }
    }
    
    loadData();
  }, [isAuthenticated, user?.id]);

  const addGeneration = useCallback(
    async (gen: Omit<Generation, "id" | "createdAt">): Promise<string | undefined> => {
      const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `gen-${Date.now()}`;
      const newGeneration: Generation = {
        ...gen,
        id: tempId,
        createdAt: new Date().toISOString(),
      };

      // Optimistic local update for responsive UI
      setGenerations((prev) => [newGeneration, ...prev]);

      if (!user) return tempId;
      
      const insertData = {
        id: tempId,
        user_id: user.id,
        title: gen.title,
        template: gen.template,
        category: gen.category,
        status: gen.status,
        preview: gen.preview,
        word_count: gen.wordCount,
      };

      const { data, error } = await supabase
        .from('generations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Failed to persist generation to Supabase:", error.message);
        throw new Error(`Failed to persist generation to database: ${error.message}`);
      }

      if (data) {
        const mapped = mapRowToGeneration(data);
        setGenerations((prev) => prev.map((g) => (g.id === tempId ? mapped : g)));
        return data.id;
      }

      return tempId;
    },
    [supabase, user]
  );

  const updateGeneration = useCallback(
    async (id: string, updates: Partial<Omit<Generation, "id">>) => {
      // Optimistic local update
      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
      );

      if (!user) return;

      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.template !== undefined) updateData.template = updates.template;
      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.status !== undefined) updateData.status = updates.status;
      if (updates.preview !== undefined) updateData.preview = updates.preview;
      if (updates.wordCount !== undefined) updateData.word_count = updates.wordCount;
      if (updates.createdAt !== undefined) updateData.created_at = updates.createdAt;

      const { data, error } = await supabase
        .from('generations')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Failed to update generation in Supabase:", error.message);
        throw new Error(`Failed to update generation in database: ${error.message}`);
      }

      if (data) {
        const mapped = mapRowToGeneration(data);
        setGenerations((prev) => prev.map((g) => (g.id === id ? mapped : g)));
      }
    },
    [supabase, user]
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

      const { error } = await supabase.from('generations').delete().eq('id', id);
      if (error) {
        console.error("Failed to delete generation from Supabase:", error.message);
        // Rollback optimistic removal
        if (target) {
          setGenerations((prev) => [target, ...prev]);
        }
        throw new Error(`Failed to delete generation: ${error.message}`);
      }
    },
    [generations, supabase, user]
  );

  const importGeneration = useCallback(
    async (gen: Omit<Generation, "id" | "createdAt"> & { createdAt?: string }) => {
      const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `gen-${Date.now()}`;
      const newGeneration: Generation = {
        ...gen,
        id: tempId,
        createdAt: gen.createdAt || new Date().toISOString(),
      };

      setGenerations((prev) => [newGeneration, ...prev]);

      if (!user) return;
      
      const insertData: any = {
        id: tempId,
        user_id: user.id,
        title: gen.title,
        template: gen.template,
        category: gen.category,
        status: gen.status,
        preview: gen.preview,
        word_count: gen.wordCount,
      };
      
      if (gen.createdAt) {
        insertData.created_at = gen.createdAt;
      }

      const { data, error } = await supabase
        .from('generations')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Failed to import generation to Supabase:", error.message);
        throw new Error(`Failed to import generation: ${error.message}`);
      }

      if (data) {
        const mapped = mapRowToGeneration(data);
        setGenerations((prev) => prev.map((g) => (g.id === tempId ? mapped : g)));
      }
    },
    [supabase, user]
  );

  const restoreLastDeleted = useCallback(async () => {
    if (!lastDeleted) return false;
    
    const restored = lastDeleted;
    setGenerations((prev) => [restored, ...prev]);
    setLastDeleted(null);

    if (!user) return true;

    const insertData = {
      id: restored.id,
      user_id: user.id,
      title: restored.title,
      template: restored.template,
      category: restored.category,
      status: restored.status,
      preview: restored.preview,
      word_count: restored.wordCount,
      created_at: restored.createdAt,
    };

    const { error } = await supabase
      .from('generations')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Failed to restore generation to Supabase:", error.message);
      return false;
    }

    return true;
  }, [lastDeleted, supabase, user]);

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
