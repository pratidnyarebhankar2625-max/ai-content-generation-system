"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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
import { marked } from "marked";

interface GenerateWorkspaceProps {
  templateId: number;
}

export default function GenerateWorkspace({ templateId }: GenerateWorkspaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addGeneration, updateGeneration, getGeneration, isLoaded } = useContent();



  const [template, setTemplate] = useState<any>(null);
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState("Professional");
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [editorContent, setEditorContent] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const editGenerationId = searchParams.get("generationId");
    if (editGenerationId && !generationId && isLoaded) {
      const gen = getGeneration(editGenerationId);
      if (gen) {
        setGenerationId(gen.id);
        setTopic(gen.title);
        setEditorContent(gen.preview);
      }
    }
  }, [searchParams, generationId, isLoaded, getGeneration]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const onFormSubmit = async (e?: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>, isContinue = false) => {
    if (e) e.preventDefault();
    if (!topic.trim()) return;
    
    setIsLoading(true);
    setError(null);
    if (!isContinue) {
      setEditorContent("Generating...");
      setMessages([]);
      setIsTruncated(false);
    }
    
    let currentGenerationId = generationId;
    if (!currentGenerationId && template) {
      const newId = await addGeneration({
        title: topic || `New ${template.title}`,
        template: template.title,
        category: template.category,
        status: "draft",
        wordCount: 0,
        preview: "Generating...",
      });
      if (newId) {
        setGenerationId(newId);
        currentGenerationId = newId;
      }
    }

    let currentMessages: any[] = [];
    if (isContinue) {
      currentMessages = [...messages];
    } else {
      currentMessages = [{ role: "user", content: `Topic: ${topic}\nKeywords: ${keywords}\nTone: ${tone}` }];
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: topic,
          template: template?.title || "Custom Template",
          context: {
            keywords,
            tone,
          },
          messages: currentMessages,
          isContinue
        })
      });

      if (!res.ok) {
         const errData = await res.json();
         throw new Error(errData.error || "Generation failed");
      }

      const data = await res.json();
      let rawText = data.text;
      
      let finalRawContent = rawText;
      
      if (isContinue) {
         // Get previous assistant message and append new text
         const prevMsg = currentMessages[currentMessages.length - 1]?.content || "";
         // Remove the truncation warning from previous text if it exists
         const strippedPrev = prevMsg.replace(/\n\n\[Response truncated — click Continue to generate the remaining content\.\]$/, "");
         finalRawContent = strippedPrev + rawText;
         // Replace the last message
         currentMessages[currentMessages.length - 1] = { role: "assistant", content: finalRawContent };
         setMessages([...currentMessages]);
      } else {
         setMessages([...currentMessages, { role: "assistant", content: finalRawContent }]);
      }

      // Convert Markdown to HTML for the RichTextEditor
      let htmlContent = await marked.parse(finalRawContent);
      
      setEditorContent(htmlContent);
      setIsTruncated(data.isTruncated);
      
      if (currentGenerationId) {
        updateGeneration(currentGenerationId, {
          status: "completed",
          preview: htmlContent,
          wordCount: htmlContent.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter((w: string) => w.length > 0).length,
        });
      }
    } catch(err: any) {
      setError(err);
      if (currentGenerationId) {
        updateGeneration(currentGenerationId, {
          status: "failed",
          preview: "Generation failed.",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

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




  const handleEditorSave = async (content: string) => {
    const plainText = content.replace(/<[^>]*>?/gm, '');
    const words = plainText.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (!generationId && template && (topic || content)) {
      const newId = await addGeneration({
        title: topic || `New ${template.title}`,
        template: template.title,
        category: template.category,
        status: "draft",
        wordCount: words,
        preview: content || "Empty draft",
      });
      if (newId) setGenerationId(newId);
    } else if (generationId) {
      updateGeneration(generationId, {
        title: topic || `New ${template.title}`,
        status: "draft",
        preview: content,
        wordCount: words,
      });
    }
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
          <h1 className="font-heading text-[28px] font-semibold leading-tight tracking-tight text-foreground flex items-center gap-2">
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
              initialContent={editorContent || ""} 
              isStreaming={isLoading}
              onSave={handleEditorSave}
              onChange={(content) => setEditorContent(content)}
            />
            
            {isTruncated && (
              <div className="mt-4 p-4 border border-blue-200 bg-blue-50 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-600 shrink-0" />
                  <p className="text-sm text-blue-800">
                    The generation reached its maximum length and was paused. Click Continue to finish the content.
                  </p>
                </div>
                <button
                  onClick={(e) => onFormSubmit(e as any, true)}
                  disabled={isLoading}
                  className="w-full sm:w-auto shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                >
                  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                  Continue Generation
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
