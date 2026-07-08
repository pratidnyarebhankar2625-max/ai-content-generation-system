"use client";

import { useState } from "react";

type CreateTemplateFormProps = {
  onClose: () => void;
  onCreate: (template: {
    title: string;
    description: string;
    category: string;
  }) => void;
};

export default function CreateTemplateForm({
  onClose,
  onCreate,
}: CreateTemplateFormProps) {
console.log("onCreate received:", onCreate);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Blog");


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
          Create New Template
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
            Create Template
          </button>

        </div>

      </div>

    </div>
  );
}