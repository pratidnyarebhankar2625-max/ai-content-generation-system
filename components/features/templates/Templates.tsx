"use client";

import { useState } from "react";
import TemplateCard from "./TemplateCard";
import CreateTemplateForm from "./CreateTemplateForm";
import { templates } from "./templateData";

export default function Templates() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [templateList, setTemplateList] = useState(templates);

  const categories = [
    "All",
    "Blog",
    "Social Media",
    "Email",
    "Marketing",
  ];

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">
            Content Templates
          </h1>

          <p className="text-muted-foreground">
            Choose a template and generate content faster.
          </p>
        </div>

        <button
          onClick={() => setShowCreateForm(true)}
          className="rounded-lg bg-primary px-4 py-2 text-primary-foreground"
        >
          + Create Template
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
          id: Date.now().toString(),
          ...newTemplate,
        },
      ])

      setShowCreateForm(false);
    }}
  />
)}
      {/* Search */}
      <input
        placeholder="Search templates..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-lg border p-3"
      />

      {/* Categories */}
      <div className="flex flex-wrap gap-3">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`rounded-full border px-4 py-2 transition ${
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Templates */}
      {filteredTemplates.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              title={template.title}
              description={template.description}
              category={template.category}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border p-10 text-center">
          <h2 className="text-xl font-semibold">
            No templates found
          </h2>

          <p className="mt-2 text-muted-foreground">
            Try changing your search or selecting another category.
          </p>
        </div>
      )}
    </div>
  );
}