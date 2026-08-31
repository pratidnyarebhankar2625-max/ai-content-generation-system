"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Copy,
  RefreshCw,
  Sparkles,
  Wand2,
  FileText,
} from "lucide-react";

type RecommendationItem = {
  type: "success" | "warning" | "error";
  category?: string;
  message?: string;
  text?: string;
  priority?: "low" | "medium" | "high";
};

type KeywordItem = {
  word: string;
  searchVolume: string;
  difficulty: "Easy" | "Medium" | "Hard" | "Very Hard";
};

type CategorizedKeywords = {
  primary: KeywordItem[];
  secondary: KeywordItem[];
  longTail: KeywordItem[];
  related: KeywordItem[];
};

type SeoAnalysisData = {
  id?: string;
  score: number;
  breakdown?: Record<string, { score: number; max: number }>;
  analysis?: any;
  recommendations: RecommendationItem[];
  keywords: CategorizedKeywords;
};

export default function SeoContent() {
  const [isClient, setIsClient] = useState(false);
  const [focusKeyword, setFocusKeyword] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [content, setContent] = useState("");
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [analysisData, setAnalysisData] = useState<SeoAnalysisData | null>(null);

  const [activeTab, setActiveTab] = useState<"analysis" | "keywords">("analysis");
  const [keywordTab, setKeywordTab] = useState<"primary" | "secondary" | "longTail" | "related">("primary");

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleAnalyze = async () => {
    if (!focusKeyword.trim()) {
      toast.error("Please enter a focus keyword to analyze.");
      return;
    }
    
    setIsAnalyzing(true);
    
    try {
      const response = await fetch("/api/seo/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus_keyword: focusKeyword.trim(),
          meta_title: metaTitle,
          meta_description: metaDescription,
          content: content,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "SEO Analysis failed");
      }

      setAnalysisData(json.data);
      setHasAnalyzed(true);
      toast.success("SEO Analysis complete!");
    } catch (err: any) {
      console.error("SEO Analysis error:", err);
      toast.error(err.message || "Failed to analyze content");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAutoOptimize = async () => {
    if (!focusKeyword.trim()) {
      toast.error("Please enter a focus keyword first.");
      return;
    }

    setIsOptimizing(true);
    toast.info("AI is optimizing your meta tags...");

    try {
      const response = await fetch("/api/seo/optimize-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          focus_keyword: focusKeyword.trim(),
          existing_title: metaTitle,
          existing_description: metaDescription,
          content: content,
        }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.error?.message || json.error || "Failed to optimize meta tags");
      }

      if (json.data?.metaTitle) {
        setMetaTitle(json.data.metaTitle);
      }
      if (json.data?.metaDescription) {
        setMetaDescription(json.data.metaDescription);
      }

      toast.success("Meta tags optimized by AI!");
    } catch (err: any) {
      console.error("Auto-optimize error:", err);
      toast.error(err.message || "Failed to auto-optimize meta tags");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const score = hasAnalyzed && analysisData ? analysisData.score : 0;
  const scoreColor = score >= 80 ? "text-emerald-500" : score >= 50 ? "text-amber-500" : "text-rose-500";
  const ringColor = score >= 80 ? "stroke-emerald-500" : score >= 50 ? "stroke-amber-500" : "stroke-rose-500";

  const recommendations = analysisData?.recommendations || [];
  const keywords = analysisData?.keywords || { primary: [], secondary: [], longTail: [], related: [] };

  if (!isClient) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-[500px] lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-[500px] rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          SEO Assistant
        </h1>
        <p className="mt-2 text-lg text-muted-foreground max-w-2xl">
          Optimize your content for search engines. Analyze keywords, meta tags, and readability scores to rank higher.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Left Column: Inputs */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mb-6">
              <Search className="h-5 w-5 text-primary" />
              Content Optimization
            </h2>
            
            <div className="space-y-5">
              {/* Focus Keyword */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-foreground">Focus Keyword</label>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={focusKeyword}
                    onChange={(e) => setFocusKeyword(e.target.value)}
                    placeholder="e.g. AI Content Marketing"
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2.5 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || !focusKeyword.trim()}
                    className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    Analyze
                  </button>
                </div>
              </div>

              {/* Meta Title */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">Meta Title</label>
                  <span className={`text-xs font-medium ${metaTitle.length > 60 ? 'text-rose-500' : 'text-muted-foreground'}`}>
                    {metaTitle.length} / 60
                  </span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={metaTitle}
                    onChange={(e) => setMetaTitle(e.target.value)}
                    placeholder="Enter an engaging SEO title..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 pr-10 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <button 
                    onClick={() => handleCopy(metaTitle, "Title")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                    title="Copy Title"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Meta Description */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground">Meta Description</label>
                  <span className={`text-xs font-medium ${metaDescription.length > 160 ? 'text-rose-500' : metaDescription.length < 120 && metaDescription.length > 0 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                    {metaDescription.length} / 160
                  </span>
                </div>
                <div className="relative">
                  <textarea
                    value={metaDescription}
                    onChange={(e) => setMetaDescription(e.target.value)}
                    rows={3}
                    placeholder="Write a compelling meta description that encourages clicks..."
                    className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                  <div className="absolute bottom-3 right-3 flex gap-2">
                    <button 
                      onClick={handleAutoOptimize}
                      disabled={isOptimizing || !focusKeyword.trim()}
                      className="rounded-md bg-muted p-1.5 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
                      title="Auto-Optimize with AI"
                    >
                      {isOptimizing ? (
                        <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <Wand2 className="h-4 w-4" />
                      )}
                    </button>
                    <button 
                      onClick={() => handleCopy(metaDescription, "Description")}
                      className="rounded-md bg-muted p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                      title="Copy Description"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Article Content / Body (Optional) */}
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Article Content / Body <span className="text-xs text-muted-foreground font-normal">(Optional)</span>
                  </label>
                  <span className="text-xs font-medium text-muted-foreground">
                    {content.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="Paste your article body here for full content, heading, and readability analysis..."
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Right Column: Analysis */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rounded-2xl border border-border bg-card p-0 shadow-sm overflow-hidden flex flex-col h-full min-h-[500px]">
            
            {!hasAnalyzed && !isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/30">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Search className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold text-foreground">Ready to Analyze</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-[250px]">
                  Enter a focus keyword and click analyze to see your SEO score and actionable recommendations.
                </p>
              </div>
            ) : isAnalyzing ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
                <h3 className="text-lg font-bold text-foreground">Analyzing Content...</h3>
                <p className="text-sm text-muted-foreground mt-2">Running deterministic rules and AI semantic analysis.</p>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                {/* Score Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-muted/20">
                  <div>
                    <h3 className="text-lg font-bold text-foreground">SEO Score</h3>
                    <p className="text-sm text-muted-foreground">Deterministic rule evaluation</p>
                  </div>
                  <div className="relative h-16 w-16">
                    <svg className="h-full w-full -rotate-90 transform" viewBox="0 0 100 100">
                      <circle
                        className="stroke-muted"
                        strokeWidth="8"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                      />
                      <motion.circle
                        className={ringColor}
                        strokeWidth="8"
                        strokeLinecap="round"
                        fill="transparent"
                        r="40"
                        cx="50"
                        cy="50"
                        initial={{ strokeDasharray: "0 251.2" }}
                        animate={{ strokeDasharray: `${(score / 100) * 251.2} 251.2` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-lg font-bold ${scoreColor}`}>{score}</span>
                    </div>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border">
                  <button 
                    onClick={() => setActiveTab("analysis")}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "analysis" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Analysis
                  </button>
                  <button 
                    onClick={() => setActiveTab("keywords")}
                    className={`flex-1 py-3 text-sm font-semibold transition-colors ${activeTab === "keywords" ? "text-primary border-b-2 border-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Keywords
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-6 flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    {activeTab === "analysis" ? (
                      <motion.div 
                        key="analysis"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Recommendations</h4>
                        <div className="space-y-3">
                          {recommendations.length > 0 ? (
                            recommendations.map((rec, i) => {
                              const messageText = rec.message || rec.text || "";
                              return (
                                <div key={i} className="flex gap-3 text-sm">
                                  {rec.type === "success" && <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />}
                                  {rec.type === "error" && <XCircle className="h-5 w-5 text-rose-500 shrink-0" />}
                                  {rec.type === "warning" && <AlertCircle className="h-5 w-5 text-amber-500 shrink-0" />}
                                  <span className="text-foreground">{messageText}</span>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-sm text-muted-foreground">No recommendations generated.</p>
                          )}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="keywords"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                          {(["primary", "secondary", "longTail", "related"] as const).map((tab) => (
                            <button
                              key={tab}
                              onClick={() => setKeywordTab(tab)}
                              className={`whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                keywordTab === tab ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-border"
                              }`}
                            >
                              {tab.charAt(0).toUpperCase() + tab.slice(1).replace(/([A-Z])/g, ' $1')}
                            </button>
                          ))}
                        </div>
                        
                        <div className="space-y-2 mt-4">
                          {(keywords[keywordTab] || []).length > 0 ? (
                            (keywords[keywordTab] || []).map((kw, i) => (
                              <div key={i} className="flex items-center justify-between rounded-xl border border-border p-3 hover:bg-muted/50 transition-colors">
                                <div>
                                  <p className="font-semibold text-sm text-foreground">{kw.word}</p>
                                  <p className="text-xs text-muted-foreground flex gap-2">
                                    <span>Vol: {kw.searchVolume}</span>
                                    <span>•</span>
                                    <span className={kw.difficulty === 'Easy' ? 'text-emerald-500' : kw.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'}>Diff: {kw.difficulty}</span>
                                  </p>
                                </div>
                                <button 
                                  onClick={() => handleCopy(kw.word, "Keyword")}
                                  className="rounded-lg p-2 text-muted-foreground hover:bg-background shadow-sm hover:text-foreground transition-all border border-transparent hover:border-border"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground p-4 text-center">No keywords found for this category.</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
    </div>
  );
}
