"use client";

import { useState } from "react";

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
console.log("onCreate received:", onCreate);

 const [title, setTitle] = useState(initialData?.title || "");
const [description, setDescription] = useState(
  initialData?.description || ""
);
const [category, setCategory] = useState(
  initialData?.category || "Blog"
);


  const handleSubmit = () => {
  console.log("Create button clicked");

  if (!title || !description) {
    console.log("Missing fields");
    return;
  }

  console.log({
    title,
    description,
    category,
  });

 onCreate({
  id: initialData?.id,
  title,
  description,
  category,
});

  onClose();
};


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">

      <div className="relative w-full max-w-md rounded-xl bg-background p-6 shadow-lg">


        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-xl"
        >
          ×
        </button>


        <h2 className="text-xl font-semibold">
  {isEditing ? "Edit Template" : "Create New Template"}
</h2>


        <div className="mt-4 space-y-4">

          <input
            placeholder="Template name"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-lg border p-3"
          />


          <textarea
            placeholder="Template description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border p-3"
          />


          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border p-3"
          >
            <option>Blog</option>
            <option>Social Media</option>
            <option>Email</option>
            <option>Marketing</option>
          </select>


          <button
            onClick={handleSubmit}
            className="w-full rounded-lg bg-primary px-4 py-2 text-primary-foreground"
          >
            {isEditing ? "Save Changes" : "Create Template"}
          </button>

        </div>

      </div>

    </div>
  );
}