"use client";

import { useEffect, useState } from "react";
import TemplateCard from "./TemplateCard";
import CreateTemplateForm from "./CreateTemplateForm";
import { templates } from "./templateData";
import { Search, Sparkles, FileText, Plus } from "lucide-react";

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateList, setTemplateList] = useState(templates);

useEffect(() => {
  const savedTemplates = localStorage.getItem("userTemplates");

  if (savedTemplates) {
    const parsed = JSON.parse(savedTemplates);

    const validTemplates = parsed.filter(
      (t: any) => t.id != null
    );

    setTemplateList([
      ...templates,
      ...validTemplates,
    ]);
  }
}, []);

useEffect(() => {
  const userTemplates = templateList.filter(
    (template) => template.id != null && template.id > 1000
  );

  localStorage.setItem(
    "userTemplates",
    JSON.stringify(userTemplates)
  );
}, [templateList]);

  const categories = [
  "All",
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
    const matchesCategory =
      selectedCategory === "All" ||
      template.category === selectedCategory;

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
    <div className="space-y-8 animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8860B] shadow-lg shadow-[#D4A843]/20">
              <Sparkles className="h-6 w-6 text-[#1C1917]" />
            </div>
            <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">
              Content Templates
            </h1>
          </div>

          <p className="text-[#87817B] text-base">
            Choose a template and generate content faster.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1C1917] to-[#292524] px-6 py-3 text-sm font-medium text-[#D4A843] border border-[#D4A843]/20 shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:border-[#D4A843]/40 hover:scale-[1.02]"
        >
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      {/* Popup */}
      {showCreateForm && (
  <CreateTemplateForm
    onClose={() => setShowCreateForm(false)}
    onCreate={(newTemplate) => {
      setTemplateList((prev) => [
        ...prev,
        {
  ...newTemplate,
  id: Date.now(),
},
      ])

      setShowCreateForm(false);
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
          className="w-full rounded-2xl border border-border bg-[var(--surface-input)] py-3.5 pl-12 pr-4 text-sm shadow-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
        />
      </div>

      {/* Categories */}
      <div className="flex flex-wrap gap-3 animate-fade-in-up stagger-2">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full border px-5 py-2.5 text-sm font-medium transition-all duration-300 ${
              selectedCategory === category
                ? "bg-[#1C1917] text-[#D4A843] border-[#D4A843]/30 shadow-md"
                : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {category}
          </button>
        ))}
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
  onDelete={deleteTemplate}
  index={index}
/>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-[var(--surface-card)] py-24 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D4A843]/8">
            <FileText className="h-9 w-9 text-[#B8860B]/60" />
          </div>
          <h2 className="mt-6 font-heading text-2xl font-semibold text-foreground">
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
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1C1917] to-[#292524] px-6 py-3 text-sm font-medium text-[#D4A843] border border-[#D4A843]/20 transition-all duration-300 hover:shadow-md hover:border-[#D4A843]/40"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}