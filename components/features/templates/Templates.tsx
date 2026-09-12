"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useMemo } from "react";
import TemplateCard from "./TemplateCard";
import CreateTemplateForm from "./CreateTemplateForm";
import { templates as builtInTemplates, type Template as BuiltInTemplate } from "./templateData";
import { Search, Sparkles, FileText, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";

export interface UserTemplate {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  category: string;
  content?: string;
  is_favorite: boolean;
  created_at?: string;
  updated_at?: string;
}

export type DisplayTemplate = {
  id: string | number;
  title: string;
  description: string;
  category: string;
  content?: string;
  is_favorite?: boolean;
  isUserTemplate?: boolean;
};

export default function Templates() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTemplates, setUserTemplates] = useState<UserTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<DisplayTemplate | null>(null);

  const categories = [
    "All",
    "Favorites",
    "Writing",
    "Email",
    "Social Media",
    "Marketing",
    "Business",
    "Education",
    "Developer",
    "AI Utility",
  ];

  const [builtInFavorites, setBuiltInFavorites] = useState<number[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem("built_in_favorites");
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fetch custom user templates from the backend API
  const fetchUserTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/templates?limit=100");
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.items) {
          setUserTemplates(json.data.items);
        }
      }
    } catch (err) {
      console.error("Failed to load user templates:", err);
      toast.error("Failed to load your custom templates");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUserTemplates();
  }, [fetchUserTemplates]);

  // Combine user templates (with UUIDs) and built-in system presets (with numbers)
  const templateList: DisplayTemplate[] = useMemo(() => {
    const formattedUserTemplates: DisplayTemplate[] = userTemplates.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.category,
      content: t.content,
      is_favorite: t.is_favorite,
      isUserTemplate: true,
    }));

    const formattedBuiltIn: DisplayTemplate[] = builtInTemplates.map((t) => ({
      ...t,
      is_favorite: builtInFavorites.includes(t.id),
      isUserTemplate: false,
    }));

    return [...formattedUserTemplates, ...formattedBuiltIn];
  }, [userTemplates, builtInFavorites]);

  // Handle template creation via API
  const handleCreateTemplate = async (templateData: {
    title: string;
    description: string;
    category: string;
    content?: string;
  }) => {
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to create template");
      }

      const json = await res.json();
      if (json.success && json.data) {
        setUserTemplates((prev) => [json.data, ...prev]);
        toast.success("Template created successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to create template");
    }
  };

  // Handle template editing via API
  const handleUpdateTemplate = async (
    id: string,
    updates: {
      title: string;
      description: string;
      category: string;
      content?: string;
    }
  ) => {
    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to update template");
      }

      const json = await res.json();
      if (json.success && json.data) {
        setUserTemplates((prev) =>
          prev.map((t) => (t.id === id ? { ...t, ...json.data } : t))
        );
        toast.success("Template updated successfully");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to update template");
    }
  };

  // Handle template deletion via API
  const handleDeleteTemplate = async (id: string | number) => {
    if (typeof id !== "string") {
      // Built-in templates cannot be deleted
      return;
    }

    const previousTemplates = [...userTemplates];
    setUserTemplates((prev) => prev.filter((t) => t.id !== id));

    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error?.message || "Failed to delete template");
      }

      toast.success("Template deleted successfully");
    } catch (err: any) {
      // Rollback on error
      setUserTemplates(previousTemplates);
      toast.error(err.message || "Failed to delete template");
    }
  };

  // Handle favorite toggling via API (or local storage for built-in system presets)
  const handleToggleFavorite = async (id: string | number) => {
    if (typeof id === "number" || (!isNaN(Number(id)) && typeof id !== "string")) {
      const numId = Number(id);
      setBuiltInFavorites((prev) => {
        const next = prev.includes(numId)
          ? prev.filter((i) => i !== numId)
          : [...prev, numId];
        try {
          localStorage.setItem("built_in_favorites", JSON.stringify(next));
        } catch {}
        return next;
      });
      return;
    }

    if (typeof id !== "string") return;

    const target = userTemplates.find((t) => t.id === id);
    if (!target) return;

    const newFavoriteState = !target.is_favorite;

    // Optimistic update
    setUserTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, is_favorite: newFavoriteState } : t))
    );

    try {
      const res = await fetch(`/api/templates/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: newFavoriteState }),
      });

      if (!res.ok) {
        throw new Error("Failed to update favorite status");
      }
    } catch (err) {
      // Rollback on error
      setUserTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_favorite: target.is_favorite } : t))
      );
      toast.error("Failed to update favorite");
    }
  };

  // Filter templates by category and search
  const filteredTemplates = useMemo(() => {
    return templateList.filter((template) => {
      let matchesCategory = false;
      if (selectedCategory === "All") {
        matchesCategory = true;
      } else if (selectedCategory === "Favorites") {
        matchesCategory = Boolean(template.is_favorite);
      } else {
        matchesCategory = template.category === selectedCategory;
      }

      const matchesSearch =
        template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesCategory && matchesSearch;
    });
  }, [templateList, selectedCategory, searchQuery]);

  return (
    <div className="space-y-6 md:space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in-up">
        <div className="space-y-1.5 sm:space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/20 shrink-0">
              <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
            </div>
            <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-foreground">
              Content Templates
            </h1>
          </div>

          <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
            Choose a template and generate content faster.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowCreateForm(true);
          }}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-xs sm:text-sm font-semibold text-primary-foreground border-transparent shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:border-transparent hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Popup Form */}
      {showCreateForm && (
        <CreateTemplateForm
          initialData={editingTemplate || undefined}
          isEditing={!!editingTemplate}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTemplate(null);
          }}
          onCreate={async (newTemplate) => {
            if (editingTemplate && typeof editingTemplate.id === "string") {
              await handleUpdateTemplate(editingTemplate.id, newTemplate);
            } else {
              await handleCreateTemplate(newTemplate);
            }
            setShowCreateForm(false);
            setEditingTemplate(null);
          }}
        />
      )}

      {/* Search */}
      <div className="relative animate-fade-in-up stagger-1">
        <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
        <input
          placeholder="Search templates by name or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full rounded-2xl border border-border bg-[var(--surface-input)] py-3.5 pl-12 pr-4 text-sm shadow-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2.5 overflow-x-auto pb-3 scrollbar-hide animate-fade-in-up stagger-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        {categories.map((category) => {
          const count = templateList.filter((template) => {
            const matchesSearch =
              template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              template.description.toLowerCase().includes(searchQuery.toLowerCase());
            if (!matchesSearch) return false;

            if (category === "All") return true;
            if (category === "Favorites") return Boolean(template.is_favorite);
            return template.category === category;
          }).length;

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`group flex flex-shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2 sm:px-4 sm:py-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 ${
                selectedCategory === category
                  ? "bg-[#113680] text-white border-[#113680] shadow-md hover:bg-[#113680]/90 hover:-translate-y-0.5"
                  : "border-border/60 bg-card text-muted-foreground hover:bg-muted hover:text-foreground hover:-translate-y-0.5"
              }`}
            >
              {category}
              <span
                className={`flex items-center justify-center rounded-full px-2 py-0.5 text-xs font-bold transition-colors duration-300 ${
                  selectedCategory === category
                    ? "bg-white/20 text-white"
                    : "bg-muted text-muted-foreground group-hover:bg-muted-foreground/10 group-hover:text-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              title={template.title}
              description={template.description}
              category={template.category}
              isUserTemplate={template.isUserTemplate}
              isFavorite={Boolean(template.is_favorite)}
              onFavorite={(id) => handleToggleFavorite(id)}
              onUse={(id) => {
                router.push(`/generate/${id}`);
              }}
              onEdit={(id) => {
                const templateToEdit = templateList.find((t) => t.id === id);
                if (templateToEdit) {
                  setEditingTemplate(templateToEdit);
                  setShowCreateForm(true);
                }
              }}
              onDelete={(id) => handleDeleteTemplate(id)}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card p-12 text-center animate-fade-in sm:p-16">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 shadow-inner">
            <FileText className="h-10 w-10 text-primary" />
          </div>
          <h2 className="mb-2 font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            No templates found
          </h2>

          <p className="mx-auto max-w-md text-base text-muted-foreground">
            Try changing your search or selecting another category.
          </p>

          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground border-transparent transition-all duration-300 hover:shadow-md hover:border-transparent"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}