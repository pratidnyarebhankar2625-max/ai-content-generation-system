"use client";

import { useState } from "react";
import {
  Clock,
  FileText,
  Mail,
  MessageSquare,
  Briefcase,
  GraduationCap,
  Code,
  Sparkles,
  Search,
  Filter,
  Calendar,
  Eye,
  Copy,
  Trash2,
  ChevronDown,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
  Minus,
  FolderOpen,
} from "lucide-react";

type HistoryItem = {
  id: number;
  title: string;
  template: string;
  category: string;
  status: "completed" | "draft" | "failed";
  createdAt: string;
  wordCount: number;
  preview: string;
};

const categoryIcons: Record<string, React.ReactNode> = {
  "Blog Writing": <FileText className="h-4 w-4" />,
  Email: <Mail className="h-4 w-4" />,
  "Social Media": <MessageSquare className="h-4 w-4" />,
  Marketing: <Briefcase className="h-4 w-4" />,
  Business: <Briefcase className="h-4 w-4" />,
  Education: <GraduationCap className="h-4 w-4" />,
  Developer: <Code className="h-4 w-4" />,
  "AI Utility": <Sparkles className="h-4 w-4" />,
};

const statusConfig = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-emerald-50/80 text-emerald-700 border-emerald-100",
  },
  draft: {
    label: "Draft",
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    className: "bg-amber-50/80 text-amber-700 border-amber-100",
  },
  failed: {
    label: "Failed",
    icon: <Loader2 className="h-3.5 w-3.5" />,
    className: "bg-red-50/80 text-red-600 border-red-100",
  },
};

const sampleHistory: HistoryItem[] = [
  {
    id: 1,
    title: "10 Tips for Better Productivity",
    template: "Blog Post Generator",
    category: "Blog Writing",
    status: "completed",
    createdAt: "2025-07-09T14:30:00",
    wordCount: 1250,
    preview:
      "Discover the top 10 productivity tips that will transform your daily routine. From time-blocking techniques to the Pomodoro method...",
  },
  {
    id: 2,
    title: "Summer Sale Announcement",
    template: "Email Campaign",
    category: "Email",
    status: "completed",
    createdAt: "2025-07-08T11:15:00",
    wordCount: 420,
    preview:
      "Get ready for our biggest summer sale yet! Enjoy up to 50% off on selected items. Limited time offer, don't miss out...",
  },
  {
    id: 3,
    title: "New Product Launch Post",
    template: "Instagram Caption",
    category: "Social Media",
    status: "completed",
    createdAt: "2025-07-08T09:45:00",
    wordCount: 180,
    preview:
      "✨ Introducing our latest innovation! We've been working behind the scenes to bring you something truly special...",
  },
  {
    id: 4,
    title: "Q3 Marketing Strategy",
    template: "Marketing Plan",
    category: "Marketing",
    status: "draft",
    createdAt: "2025-07-07T16:20:00",
    wordCount: 2100,
    preview:
      "Our Q3 marketing strategy focuses on expanding our digital presence through targeted campaigns, influencer partnerships...",
  },
  {
    id: 5,
    title: "Employee Welcome Email",
    template: "Professional Email",
    category: "Email",
    status: "completed",
    createdAt: "2025-07-07T10:00:00",
    wordCount: 350,
    preview:
      "Welcome to the team! We're thrilled to have you on board. Here's everything you need to know for your first week...",
  },
  {
    id: 6,
    title: "API Documentation Draft",
    template: "Technical Documentation",
    category: "Developer",
    status: "draft",
    createdAt: "2025-07-06T13:50:00",
    wordCount: 3200,
    preview:
      "REST API Reference v2.0 — This document provides comprehensive documentation for all available endpoints, authentication...",
  },
  {
    id: 7,
    title: "Brand Story Article",
    template: "Blog Post Generator",
    category: "Blog Writing",
    status: "completed",
    createdAt: "2025-07-05T15:30:00",
    wordCount: 1800,
    preview:
      "Every great brand has a story worth telling. Ours began in a small garage with a big dream and an even bigger whiteboard...",
  },
  {
    id: 8,
    title: "Course Introduction Script",
    template: "Educational Content",
    category: "Education",
    status: "failed",
    createdAt: "2025-07-05T08:10:00",
    wordCount: 0,
    preview: "Generation failed — API rate limit exceeded. Please try again later.",
  },
  {
    id: 9,
    title: "LinkedIn Thought Leadership",
    template: "LinkedIn Post",
    category: "Social Media",
    status: "completed",
    createdAt: "2025-07-04T17:45:00",
    wordCount: 290,
    preview:
      "The future of work isn't about replacing humans with AI — it's about augmenting human potential. Here's what I've learned...",
  },
  {
    id: 10,
    title: "AI-Powered Content Workflow",
    template: "AI Summary",
    category: "AI Utility",
    status: "completed",
    createdAt: "2025-07-03T12:00:00",
    wordCount: 600,
    preview:
      "Streamline your content creation with this AI-powered workflow that reduces production time by 60% while maintaining quality...",
  },
];

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function HistoryContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "words">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [items, setItems] = useState<HistoryItem[]>(sampleHistory);

  const categories = ["all", ...Array.from(new Set(items.map((i) => i.category)))];

  const filtered = items
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.template.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.preview.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus =
        filterStatus === "all" || item.status === filterStatus;
      const matchesCategory =
        filterCategory === "all" || item.category === filterCategory;
      return matchesSearch && matchesStatus && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "oldest")
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return b.wordCount - a.wordCount;
    });

  const stats = {
    total: items.length,
    completed: items.filter((i) => i.status === "completed").length,
    drafts: items.filter((i) => i.status === "draft").length,
    totalWords: items.reduce((sum, i) => sum + i.wordCount, 0),
  };

  function handleCopy(item: HistoryItem) {
    navigator.clipboard.writeText(item.preview);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDelete(id: number) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8860B] shadow-lg shadow-[#D4A843]/20">
              <Clock className="h-6 w-6 text-[#1C1917]" />
            </div>
            <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">
              Generation History
            </h1>
          </div>
          <p className="max-w-2xl text-[#87817B] text-base">
            Browse and manage all your AI-generated content in one place.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
        {[
          {
            label: "Total Generated",
            value: stats.total,
            icon: <FileText className="h-5 w-5" />,
            trend: "+3 this week",
            trendType: "up",
          },
          {
            label: "Completed",
            value: stats.completed,
            icon: <CheckCircle2 className="h-5 w-5" />,
            trend: "+5 this week",
            trendType: "up",
          },
          {
            label: "Drafts",
            value: stats.drafts,
            icon: <AlertCircle className="h-5 w-5" />,
            trend: "2 pending",
            trendType: "neutral",
          },
          {
            label: "Total Words",
            value: stats.totalWords.toLocaleString(),
            icon: <Sparkles className="h-5 w-5" />,
            trend: "+2.4k this week",
            trendType: "up",
          },
        ].map((stat, index) => (
          <div
            key={stat.label}
            className="card-shimmer gold-glow group relative overflow-hidden rounded-[20px] border border-border bg-card p-6 transition-all duration-400 hover:-translate-y-1 hover:border-[#D4A843]/30 animate-fade-in-up"
            style={{ animationDelay: `${(index + 1) * 80}ms` }}
          >
            <div className="inline-flex items-center justify-center rounded-xl bg-[#D4A843]/8 p-2.5 text-[#B8860B]">
              {stat.icon}
            </div>
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-1 font-heading text-[38px] font-bold leading-none tracking-tight text-foreground">
              {stat.value}
            </p>
            <div className="mt-3">
              {stat.trendType === "up" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  <TrendingUp className="h-3 w-3" />
                  {stat.trend}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--muted)] px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  <Minus className="h-3 w-3" />
                  {stat.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters Bar */}
      <div className="space-y-5 animate-fade-in-up stagger-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, template, or content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-[var(--surface-input)] py-3.5 pl-12 pr-4 text-sm shadow-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-medium shadow-sm transition-all duration-300 ${
              showFilters
                ? "border-[#D4A843]/40 bg-[#D4A843]/10 text-[#B8860B]"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Filter className="h-4 w-4" />
            Filters
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-300 ${
                showFilters ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Sort */}
          <div className="relative">
            <button
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-6 py-3.5 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-300 hover:bg-muted"
              onClick={() =>
                setSortBy(
                  sortBy === "newest"
                    ? "oldest"
                    : sortBy === "oldest"
                    ? "words"
                    : "newest"
                )
              }
            >
              <ArrowUpDown className="h-4 w-4" />
              {sortBy === "newest"
                ? "Newest First"
                : sortBy === "oldest"
                ? "Oldest First"
                : "Most Words"}
            </button>
          </div>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="flex flex-wrap gap-6 rounded-[20px] border border-border bg-card/80 p-6 shadow-sm backdrop-blur-sm animate-fade-in-down">
            {/* Status Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Status
              </label>
              <div className="flex gap-2">
                {["all", "completed", "draft", "failed"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                      filterStatus === status
                        ? "bg-[#1C1917] text-[#D4A843] shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                      filterCategory === cat
                        ? "bg-[#1C1917] text-[#D4A843] shadow-sm"
                        : "bg-muted/60 text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
          of {items.length} results
        </p>
      </div>

      {/* History Items */}
      {filtered.length > 0 ? (
        <div className="space-y-5">
          {filtered.map((item, index) => {
            const status = statusConfig[item.status];
            const catIcon = categoryIcons[item.category] || (
              <FileText className="h-4 w-4" />
            );

            return (
              <div
                key={item.id}
                className="card-shimmer gold-glow group relative overflow-hidden rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:-translate-y-0.5 hover:border-[#D4A843]/30 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left: Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-[#B8860B]">
                        {item.title}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${status.className}`}
                      >
                        {status.icon}
                        {status.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        {catIcon}
                        {item.template}
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(item.createdAt)} at{" "}
                        {formatTime(item.createdAt)}
                      </span>
                      {item.wordCount > 0 && (
                        <span className="inline-flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5" />
                          {item.wordCount.toLocaleString()} words
                        </span>
                      )}
                    </div>

                    <p className="line-clamp-2 max-w-3xl text-sm leading-relaxed text-muted-foreground/80">
                      {item.preview}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex shrink-0 items-center gap-2 md:ml-6">
                    <button
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:border-[#D4A843]/30 hover:bg-[#D4A843]/10 hover:text-[#B8860B]"
                      title="View content"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    <button
                      onClick={() => handleCopy(item)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-[var(--shadow-button)] transition-all duration-300 ${
                        copiedId === item.id
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-border bg-card text-muted-foreground hover:border-[#D4A843]/30 hover:bg-[#D4A843]/10 hover:text-[#B8860B]"
                      }`}
                      title="Copy content"
                    >
                      {copiedId === item.id ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-[var(--surface-card)] py-24 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#D4A843]/8">
            <FolderOpen className="h-9 w-9 text-[#B8860B]/60" />
          </div>
          <h3 className="mt-6 font-heading text-2xl font-semibold text-foreground">No results found</h3>
          <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
            Try adjusting your search or filter criteria to find what you&apos;re looking for.
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setFilterStatus("all");
              setFilterCategory("all");
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#1C1917] to-[#292524] px-6 py-3 text-sm font-medium text-[#D4A843] border border-[#D4A843]/20 transition-all duration-300 hover:shadow-md hover:border-[#D4A843]/40"
          >
            Clear All Filters
          </button>
        </div>
      )}
    </div>
  );
}
