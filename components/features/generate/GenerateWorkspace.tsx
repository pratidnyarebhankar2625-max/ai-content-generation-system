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
  const [isCopied, setIsCopied] = useState(false);
  const [isSavedAsDraft, setIsSavedAsDraft] = useState(false);

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
          preview: completion,
          wordCount: completion.trim().split(/\s+/).filter(w => w.length > 0).length,
        });
      }
    }
  }, [completion, isLoading, generationId, updateGeneration]);


  const handleCopy = () => {
    if (completion) {
      navigator.clipboard.writeText(completion);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (completion) {
      const element = document.createElement("a");
      const file = new Blob([completion], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      element.download = `${topic || 'generated-content'}.txt`;
      document.body.appendChild(element); // Required for this to work in FireFox
      element.click();
    }
  };

  const handleManualSaveDraft = () => {
    if (!generationId && template && (topic || completion)) {
      const newId = Date.now();
      setGenerationId(newId);
      addGeneration({
        title: topic || `New ${template.title}`,
        template: template.title,
        category: template.category,
        status: "draft",
        wordCount: completion.trim().split(/\s+/).filter(w => w.length > 0).length,
        preview: completion || "Empty draft",
      });
      setIsSavedAsDraft(true);
      setTimeout(() => setIsSavedAsDraft(false), 2000);
    } else if (generationId) {
      updateGeneration(generationId, {
        title: topic || `New ${template.title}`,
        status: "draft",
        preview: completion,
        wordCount: completion.trim().split(/\s+/).filter(w => w.length > 0).length,
      });
      setIsSavedAsDraft(true);
      setTimeout(() => setIsSavedAsDraft(false), 2000);
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
        <Loader2 className="h-8 w-8 animate-spin text-[#D4A843]" />
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
            <Sparkles className="h-6 w-6 text-[#D4A843]" />
            {template.title} Generator
          </h1>
          <p className="text-[#87817B] text-sm mt-1">
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
                  className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all resize-none h-28 focus:outline-none focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
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
                  className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Tone of Voice</label>
                <select
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
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
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] py-3.5 text-sm font-medium text-[#D4A843] border border-[#D4A843]/20 shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-md hover:border-[#D4A843]/40 disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="flex-1 rounded-[20px] border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center justify-between border-b border-border bg-muted/20 px-6 py-3.5">
              <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generated Output
              </h3>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleManualSaveDraft}
                  disabled={!completion && !topic}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
                  title="Save as Draft"
                >
                  {isSavedAsDraft ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Save className="h-3.5 w-3.5" />}
                  Save Draft
                </button>
                <div className="w-px h-4 bg-border mx-1"></div>
                <button
                  onClick={handleCopy}
                  disabled={!completion}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
                >
                  {isCopied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!completion}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <Download className="h-3.5 w-3.5" />
                  Download
                </button>
                <button
                  onClick={(e) => {
                    // Trigger the form submit again to regenerate
                    if (topic) {
                      setGenerationId(null); // Reset generation id to create a new one, or keep it to overwrite? Let's create new.
                      complete(topic);
                    }
                  }}
                  disabled={isLoading || !completion}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-[#D4A843] bg-[#D4A843]/10 hover:bg-[#D4A843]/20 transition-colors disabled:opacity-30"
                >
                  <RotateCcw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-6 overflow-y-auto bg-gradient-to-b from-card to-muted/10 relative">
              {error && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error.message || "An error occurred during generation."}</p>
                </div>
              )}
              
              {!completion && !isLoading && !error ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/60 space-y-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center border border-dashed border-muted-foreground/30">
                    <Sparkles className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm">Your generated content will appear here</p>
                </div>
              ) : (
                <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-muted prose-pre:border prose-pre:border-border whitespace-pre-wrap text-foreground">
                  {completion}
                  {isLoading && (
                    <span className="inline-block w-2 h-4 ml-1 bg-[#D4A843] animate-pulse"></span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Ensure the icon exists since we imported it but it might have been missing
import { FileText } from "lucide-react";
