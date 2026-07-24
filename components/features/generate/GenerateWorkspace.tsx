"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useCompletion } from "@ai-sdk/react";
import { templates } from "../templates/templateData";
import { useContent } from "@/lib/content-store";
import {
  Sparkles,
  ArrowLeft,
  Copy,
  Download,
  RotateCcw,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { RichTextEditor } from "@/components/ui/RichTextEditor";

interface GenerateWorkspaceProps {
  templateId: number;
}

export default function GenerateWorkspace({ templateId }: GenerateWorkspaceProps) {
  const router = useRouter();
  const { addGeneration, updateGeneration } = useContent();

  const [template, setTemplate] = useState<any>(null);
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generationId, setGenerationId] = useState<number | null>(null);
  const [editorContent, setEditorContent] = useState("");

  const {
    completion,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading,
    error,
    complete,
  } = useCompletion({
    api: "/api/generate",
    streamProtocol: "text",
    body: {
      template: template?.title || "Custom Template",
      context: {
        keywords,
        tone,
      },
    },
    onFinish: (prompt, completion) => {
      // Stream finished
      if (generationId) {
        updateGeneration(generationId, {
          status: "completed",
          preview: completion,
          wordCount: completion.trim().split(/\s+/).filter(w => w.length > 0).length,
        });
        setEditorContent(completion);
      }
    },
    onError: (err) => {
      if (generationId) {
        updateGeneration(generationId, {
          status: "failed",
          preview: "Generation failed.",
        });
      }
    }
  });

  useEffect(() => {
    // Load template
    const savedTemplates = localStorage.getItem("userTemplates");
    let allTemplates = [...templates];
    if (savedTemplates) {
      try {
        const parsed = JSON.parse(savedTemplates);
        allTemplates = [...allTemplates, ...parsed];
      } catch (e) {}
    }
    const foundTemplate = allTemplates.find((t) => t.id === templateId);
    if (foundTemplate) {
      setTemplate(foundTemplate);
    } else {
      router.push("/templates"); // Redirect if not found
    }
  }, [templateId, router]);

  // Effect to continuously update the draft content while streaming (throttle or update occasionally)
  const lastUpdateRef = useRef<number>(0);
  useEffect(() => {
    if (isLoading && generationId && completion.length > 0) {
      const now = Date.now();
      if (now - lastUpdateRef.current > 1000) { // Update store every 1 second
        lastUpdateRef.current = now;
        updateGeneration(generationId, {
          wordCount: completion.trim().split(/\s+/).filter(w => w.length > 0).length,
        });
        setEditorContent(completion);
      }
    }
  }, [completion, isLoading, generationId, updateGeneration]);


  const handleEditorSave = (content: string) => {
    const plainText = content.replace(/<[^>]*>?/gm, '');
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (!generationId && template && (topic || content)) {
      const newId = Date.now();
      setGenerationId(newId);
      addGeneration({
        title: topic || `New ${template.title}`,
        template: template.title,
        category: template.category,
        status: "draft",
        wordCount: words,
        preview: content || "Empty draft",
      });
    } else if (generationId) {
      updateGeneration(generationId, {
        title: topic || `New ${template.title}`,
        status: "draft",
        preview: content,
        wordCount: words,
      });
    }
  };

  const onFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!topic.trim()) return;
    
    // We create the draft here before submitting
    if (!generationId && template) {
      const newId = Date.now();
      setGenerationId(newId);
      addGeneration({
        title: topic || `New ${template.title}`,
        template: template.title,
        category: template.category,
        status: "draft",
        wordCount: 0,
        preview: "Generating...",
      });
    }

    handleSubmit(e);
  };

  if (!template) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 animate-fade-in-up">
        <button
          onClick={() => router.push("/templates")}
          className="rounded-xl p-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground border border-transparent hover:border-border"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary-foreground" />
            {template.title} Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {template.description}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full min-h-[600px]">
        {/* Left Form Panel */}
        <div className="lg:col-span-4 space-y-6 animate-fade-in-up stagger-1">
          <div className="rounded-[20px] border border-border bg-card p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground mb-4">Generation Settings</h2>
            
            <form onSubmit={onFormSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Main Topic / Prompt *</label>
                <textarea
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    setInput(e.target.value); // Sync with useCompletion input
                  }}
                  placeholder="e.g. 10 tips for better productivity..."
                  className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all resize-none h-28 focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Keywords (Optional)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="e.g. focus, time management, tools"
                  className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
                >
                  <option>Professional</option>
                  <option>Casual</option>
                  <option>Enthusiastic</option>
                  <option>Informative</option>
                  <option>Persuasive</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading || !topic.trim()}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-medium text-primary-foreground border-transparent shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-md hover:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Generate Content
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Output Panel */}
        <div className="lg:col-span-8 flex flex-col animate-fade-in-up stagger-2 h-full min-h-[500px]">
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error.message || "An error occurred during generation."}</p>
            </div>
          )}
          
          <div className="flex-1 flex flex-col h-full">
            <RichTextEditor 
              initialContent={editorContent || completion || ""} 
              isStreaming={isLoading}
              onSave={handleEditorSave}
              onChange={(content) => setEditorContent(content)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
