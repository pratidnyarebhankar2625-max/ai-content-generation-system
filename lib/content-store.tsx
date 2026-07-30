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
  id: string; // Changed to string (UUID) for Supabase
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
    totalWords: generations.reduce((sum, g) => sum + g.wordCount, 0),
    templatesUsed: new Set(generations.map((g) => g.template)).size,
    thisWeek: generations.filter((g) => new Date(g.createdAt) >= weekAgo).length,
    thisWeekWords: generations
      .filter((g) => new Date(g.createdAt) >= weekAgo)
      .reduce((sum, g) => sum + g.wordCount, 0),
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
      else action = `Generated ${gen.category.toLowerCase()} content`;

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
    title: row.title,
    template: row.template,
    category: row.category,
    status: row.status as GenerationStatus,
    wordCount: row.word_count,
    preview: row.preview,
    createdAt: row.created_at,
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
    if (!isAuthenticated || !user) {
      setGenerations([]);
      setIsLoaded(true);
      return;
    }

    async function loadData() {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error loading projects:", error);
      } else if (data) {
        setGenerations(data.map(mapRowToGeneration));
      }
      setIsLoaded(true);
    }
    
    loadData();
  }, [supabase, isAuthenticated, user]);

  const addGeneration = useCallback(
    async (gen: Omit<Generation, "id" | "createdAt">): Promise<string | undefined> => {
      if (!user) return;
      
      const insertData = {
        user_id: user.id,
        title: gen.title,
        template: gen.template,
        category: gen.category,
        status: gen.status,
        preview: gen.preview,
        word_count: gen.wordCount,
      };

      const { data, error } = await supabase
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Failed to add generation:", error);
        return;
      }

      setGenerations((prev) => [mapRowToGeneration(data), ...prev]);
      return data.id;
    },
    [supabase, user]
  );

  const updateGeneration = useCallback(
    async (id: string, updates: Partial<Omit<Generation, "id">>) => {
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
        .from('projects')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error("Failed to update generation:", error);
        return;
      }

      setGenerations((prev) =>
        prev.map((g) => (g.id === id ? mapRowToGeneration(data) : g))
      );
    },
    [supabase, user]
  );

  const deleteGeneration = useCallback(
    async (id: string) => {
      if (!user) return;
      const target = generations.find((g) => g.id === id);
      if (target) {
        setLastDeleted(target);
      }

      setGenerations((prev) => prev.filter((g) => g.id !== id));
      
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) {
        console.error("Failed to delete generation:", error);
        // Rollback on failure
        if (target) setGenerations((prev) => [target, ...prev]);
      }
    },
    [generations, supabase, user]
  );

  const importGeneration = useCallback(
    async (gen: Omit<Generation, "id" | "createdAt"> & { createdAt?: string }) => {
      if (!user) return;
      
      const insertData: any = {
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
        .from('projects')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error("Failed to import generation:", error);
        return;
      }

      setGenerations((prev) => [mapRowToGeneration(data), ...prev]);
    },
    [supabase, user]
  );

  const restoreLastDeleted = useCallback(async () => {
    if (!lastDeleted || !user) return false;
    
    const insertData = {
      id: lastDeleted.id, // Supabase lets us insert with a specific UUID if it doesn't exist
      user_id: user.id,
      title: lastDeleted.title,
      template: lastDeleted.template,
      category: lastDeleted.category,
      status: lastDeleted.status,
      preview: lastDeleted.preview,
      word_count: lastDeleted.wordCount,
      created_at: lastDeleted.createdAt,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
      .select()
      .single();

    if (error) {
       console.error("Failed to restore:", error);
       return false;
    }

    setGenerations((prev) => [mapRowToGeneration(data), ...prev]);
    setLastDeleted(null);
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
