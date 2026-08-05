"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import TemplateCard from "./TemplateCard";
import CreateTemplateForm from "./CreateTemplateForm";
import { templates } from "./templateData";
import { Search, Sparkles, FileText, Plus } from "lucide-react";

export default function Templates() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateList, setTemplateList] = useState(templates);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [usageStats, setUsageStats] = useState<Record<number, number>>({});
  const [editingTemplate, setEditingTemplate] = useState<any>(null);

useEffect(() => {
  const savedTemplates = localStorage.getItem("userTemplates");
  const savedFavorites = localStorage.getItem("userFavorites");
  const savedUsage = localStorage.getItem("userUsageStats");

  if (savedTemplates) {
    const parsed = JSON.parse(savedTemplates);
    const validTemplates = parsed.filter((t: any) => t.id != null);
    setTemplateList([...templates, ...validTemplates]);
  }
  
  if (savedFavorites) {
    setFavorites(JSON.parse(savedFavorites));
  }
  
  if (savedUsage) {
    setUsageStats(JSON.parse(savedUsage));
  }
}, []);

useEffect(() => {
  const userTemplates = templateList.filter(
    (template) => template.id != null && template.id > 1000
  );
  localStorage.setItem("userTemplates", JSON.stringify(userTemplates));
}, [templateList]);

useEffect(() => {
  localStorage.setItem("userFavorites", JSON.stringify(favorites));
}, [favorites]);

useEffect(() => {
  localStorage.setItem("userUsageStats", JSON.stringify(usageStats));
}, [usageStats]);

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

  const deleteTemplate = (id: number) => {
  setTemplateList((prev) =>
    prev.filter((template) => template.id !== id)
  );
};

const filteredTemplates = templateList.filter((template) => {
    let matchesCategory = false;
    if (selectedCategory === "All") {
      matchesCategory = true;
    } else if (selectedCategory === "Favorites") {
      matchesCategory = favorites.includes(template.id);
    } else {
      matchesCategory = template.category === selectedCategory;
    }

    const matchesSearch =
      template.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      template.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return ( 
    <div className="space-y-6 md:space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#567C8D] to-[#567C8D] shadow-lg shadow-[#567C8D]/20">
              <Sparkles className="h-6 w-6 text-[#2F4156]" />
            </div>
            <h1 className="font-heading text-[40px] md:text-[56px] font-bold tracking-tight leading-[1.1] text-foreground">
              Content Templates
            </h1>
          </div>

          <p className="text-muted-foreground text-base leading-relaxed">
            Choose a template and generate content faster.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTemplate(null);
            setShowCreateForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground border-transparent shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:border-transparent hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Popup */}
      {showCreateForm && (
        <CreateTemplateForm
          initialData={editingTemplate}
          isEditing={!!editingTemplate}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTemplate(null);
          }}
          onCreate={(newTemplate) => {
            if (editingTemplate) {
              setTemplateList((prev) =>
                prev.map((t) =>
                  t.id === editingTemplate.id ? { ...t, ...newTemplate } : t
                )
              );
            } else {
              setTemplateList((prev) => [
                ...prev,
                { ...newTemplate, id: Date.now() },
              ]);
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
            if (category === "Favorites") return favorites.includes(template.id);
            return template.category === category;
          }).length;

          return (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`group flex flex-shrink-0 items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all duration-300 ${
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

      {/* Templates */}
      {filteredTemplates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template, index) => (
            <TemplateCard
              key={template.id}
              id={template.id}
              title={template.title}
              description={template.description}
              category={template.category}
              isUserTemplate={template.id != null && template.id > 1000}
              isFavorite={favorites.includes(template.id)}
              usageCount={usageStats[template.id] || 0}
              onFavorite={(id) => {
                setFavorites((prev) =>
                  prev.includes(id)
                    ? prev.filter((favId) => favId !== id)
                    : [...prev, id]
                );
              }}
              onUse={(id) => {
                setUsageStats((prev) => ({
                  ...prev,
                  [id]: (prev[id] || 0) + 1,
                }));
                router.push(`/generate/${id}`);
              }}
              onEdit={(id) => {
                const templateToEdit = templateList.find((t) => t.id === id);
                if (templateToEdit) {
                  setEditingTemplate(templateToEdit);
                  setShowCreateForm(true);
                }
              }}
              onDelete={deleteTemplate}
              index={index}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-[var(--surface-card)] py-24 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#567C8D]/8">
            <FileText className="h-9 w-9 text-primary-foreground/60" />
          </div>
          <h2 className="mt-6 font-heading text-[28px] font-semibold tracking-tight leading-tight text-foreground">
            No templates found
          </h2>

          <p className="mt-2 max-w-sm text-center text-muted-foreground">
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