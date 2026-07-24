"use client";

import { useState } from "react";
import { X } from "lucide-react";

type Template = {
  id?: number;
  title: string;
  description: string;
  category: string;
};

type CreateTemplateFormProps = {
  onClose: () => void;
  onCreate: (template: Template) => void;
  initialData?: Template;
  isEditing?: boolean;
};

export default function CreateTemplateForm({
  onClose,
  onCreate,
  initialData,
  isEditing = false,
}: CreateTemplateFormProps) {
 const [title, setTitle] = useState(initialData?.title || "");
const [description, setDescription] = useState(
  initialData?.description || ""
);
const [category, setCategory] = useState(
  initialData?.category || "Writing"
);


  const handleSubmit = () => {
  if (!title || !description) {
    return;
  }

 onCreate({
  title,
  description,
  category,
});

  onClose();
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">

      <div className="relative w-full max-w-md rounded-[24px] border border-border bg-card p-8 shadow-[var(--shadow-elevated)] animate-scale-in">


        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-xl p-1.5 text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>


        <h2 className="font-heading text-2xl font-semibold text-foreground">
  {isEditing ? "Edit Template" : "Create New Template"}
</h2>


        <div className="mt-6 space-y-4">

          <input
            placeholder="Template name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-border bg-[var(--surface-input)] p-3.5 text-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
          />


          <textarea
            placeholder="Template description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-2xl border border-border bg-[var(--surface-input)] p-3.5 text-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
          />


          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-2xl border border-border bg-[var(--surface-input)] p-3.5 text-sm transition-all duration-300 focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
          >
            <option>Writing</option>
            <option>Email</option>
            <option>Social Media</option>
            <option>Marketing</option>
            <option>Business</option>
            <option>Education</option>
            <option>Developer</option>
            <option>AI Utility</option>
          </select>


          <button
            onClick={handleSubmit}
            className="w-full rounded-2xl bg-primary px-4 py-3.5 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-lg hover:shadow-primary/20"
          >
            {isEditing ? "Save Changes" : "Create Template"}
          </button>

        </div>

      </div>

    </div>
  );
}