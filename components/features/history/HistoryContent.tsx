"use client";

import { useState, useMemo, useRef } from "react";
import { useContent, type Generation, type GenerationStatus } from "@/lib/content-store";
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
  Pencil,
  Undo2,
  Upload,
  X,
} from "lucide-react";

// ─── Shared Constants ────────────────────────────────────────────────────────

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

// ─── Helper Functions ────────────────────────────────────────────────────────

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

// ─── View Modal ──────────────────────────────────────────────────────────────

function ViewModal({
  generation,
  onClose,
}: {
  generation: Generation;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-[20px] border border-border bg-card p-8 shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            View Generation
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <div className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm text-foreground">
              {generation.title}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content Preview</label>
            <div className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">
              {generation.preview}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 capitalize">
              <span className="font-medium text-foreground">Status:</span> {generation.status}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Category:</span> {generation.category}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-foreground">Words:</span> <span className="text-primary-foreground">{generation.wordCount}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground border-transparent transition-all duration-300 hover:shadow-md hover:border-transparent"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────────

function EditModal({
  generation,
  onSave,
  onClose,
}: {
  generation: Generation;
  onSave: (id: number, updates: Partial<Omit<Generation, "id">>) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(generation.title);
  const [preview, setPreview] = useState(generation.preview);
  const [status, setStatus] = useState<GenerationStatus>(generation.status);
  const [wordCount, setWordCount] = useState(generation.wordCount);

  function handleSave() {
    onSave(generation.id, { title, preview, status, wordCount });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-[20px] border border-border bg-card p-8 shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Edit Generation
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content Preview</label>
            <textarea
              value={preview}
              onChange={(e) => {
                setPreview(e.target.value);
                setWordCount(
                  e.target.value
                    .trim()
                    .split(/\s+/)
                    .filter((w) => w.length > 0).length
                );
              }}
              rows={4}
              className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all resize-none focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <div className="flex gap-2">
              {(["completed", "draft", "failed"] as GenerationStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                    status === s
                      ? "bg-[#2F4156] text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Word Count */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Word Count: <span className="text-primary-foreground">{wordCount}</span>
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground border-transparent transition-all duration-300 hover:shadow-md hover:border-transparent"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Import Modal ────────────────────────────────────────────────────────────

function ImportModal({
  onImport,
  onClose,
}: {
  onImport: (gen: Omit<Generation, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [template, setTemplate] = useState("Imported Content");
  const [category, setCategory] = useState("Blog Writing");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<GenerationStatus>("completed");

  const wordCount = content
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  const categories = [
    "Blog Writing",
    "Email",
    "Social Media",
    "Marketing",
    "Business",
    "Education",
    "Developer",
    "AI Utility",
  ];

  function handleImport() {
    if (!title.trim() || !content.trim()) return;
    onImport({
      title: title.trim(),
      template,
      category,
      status,
      wordCount,
      preview: content.trim(),
    });
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-[20px] border border-border bg-card p-8 shadow-xl animate-fade-in-up">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-heading text-2xl font-bold text-foreground">
            Import Content
          </h2>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. My Blog Post"
              className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all placeholder:text-muted-foreground/70 focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
          </div>

          {/* Template */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Template Name</label>
            <input
              type="text"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Category</label>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-300 ${
                    category === cat
                      ? "bg-[#2F4156] text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Status</label>
            <div className="flex gap-2">
              {(["completed", "draft"] as GenerationStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-xl px-4 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                    status === s
                      ? "bg-[#2F4156] text-primary-foreground shadow-sm"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Content *</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Paste your content here..."
              className="w-full rounded-xl border border-border bg-[var(--surface-input)] px-4 py-3 text-sm transition-all resize-none placeholder:text-muted-foreground/70 focus:outline-none focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
            <p className="text-xs text-muted-foreground">
              {wordCount} words
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!title.trim() || !content.trim()}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground border-transparent transition-all duration-300 hover:shadow-md hover:border-transparent disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Import
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function HistoryContent() {
  const {
    generations,
    stats,
    deleteGeneration,
    updateGeneration,
    importGeneration,
    restoreLastDeleted,
    lastDeleted,
    isLoaded,
  } = useContent();

  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "words">("newest");
  const [showFilters, setShowFilters] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingGen, setEditingGen] = useState<Generation | null>(null);
  const [viewingGen, setViewingGen] = useState<Generation | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteToast, setShowDeleteToast] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const listRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(generations.map((i) => i.category)))],
    [generations]
  );

  const filtered = useMemo(() => {
    return generations
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
  }, [generations, searchQuery, filterStatus, filterCategory, sortBy]);

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedItems = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  function handleCopy(item: Generation) {
    navigator.clipboard.writeText(item.preview);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleDelete(id: number) {
    deleteGeneration(id);
    setShowDeleteToast(true);
    setTimeout(() => setShowDeleteToast(false), 5000);
  }

  function handleRestore() {
    restoreLastDeleted();
    setShowDeleteToast(false);
  }

  if (!isLoaded) return null;

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between animate-fade-in-up">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#567C8D] to-[#567C8D] shadow-lg shadow-[#567C8D]/20">
              <Clock className="h-6 w-6 text-[#2F4156]" />
            </div>
            <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">
              Generation History
            </h1>
          </div>
          <p className="max-w-2xl text-muted-foreground text-base">
            Browse and manage all your AI-generated content in one place.
          </p>
        </div>

        {/* Import Button */}
        <button
          onClick={() => setShowImport(true)}
          className="inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground border-transparent shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:border-transparent hover:scale-[1.02]"
        >
          <Upload className="h-4 w-4" />
          Import Content
        </button>
      </div>



      {/* Search & Filters Bar */}
      <div ref={listRef} className="space-y-5 animate-fade-in-up stagger-3 scroll-mt-24">
        <div className="flex flex-col gap-3 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by title, template, or content..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-[var(--surface-input)] py-3.5 pl-12 pr-4 text-sm shadow-sm transition-all duration-300 placeholder:text-muted-foreground/70 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center gap-2 rounded-2xl border px-6 py-3.5 text-sm font-medium shadow-sm transition-all duration-300 ${
              showFilters
                ? "border-[#567C8D]/40 bg-[#567C8D]/10 text-primary-foreground"
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
              onClick={() => {
                setSortBy(
                  sortBy === "newest"
                    ? "oldest"
                    : sortBy === "oldest"
                    ? "words"
                    : "newest"
                );
                setCurrentPage(1);
              }}
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
                    onClick={() => {
                      setFilterStatus(status);
                      setCurrentPage(1);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                      filterStatus === status
                        ? "bg-[#2F4156] text-primary-foreground shadow-sm"
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
                    onClick={() => {
                      setFilterCategory(cat);
                      setCurrentPage(1);
                    }}
                    className={`rounded-xl px-3.5 py-2 text-xs font-medium capitalize transition-all duration-300 ${
                      filterCategory === cat
                        ? "bg-[#2F4156] text-primary-foreground shadow-sm"
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
          <span className="font-semibold text-foreground">
            {filtered.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-
            {Math.min(currentPage * itemsPerPage, filtered.length)}
          </span>{" "}
          of {filtered.length} results
        </p>
      </div>

      {/* History Items */}
      {filtered.length > 0 ? (
        <div className="space-y-5">
          {paginatedItems.map((item, index) => {
            const status = statusConfig[item.status];
            const catIcon = categoryIcons[item.category] || (
              <FileText className="h-4 w-4" />
            );

            return (
              <div
                key={item.id}
                className="card-shimmer primary-glow group relative overflow-hidden rounded-[20px] border border-border bg-card p-7 transition-all duration-400 hover:-translate-y-0.5 hover:border-[#567C8D]/30 animate-fade-in-up"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  {/* Left: Content */}
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground transition-colors duration-300 group-hover:text-primary-foreground">
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
                      onClick={() => setViewingGen(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:border-[#567C8D]/30 hover:bg-[#567C8D]/10 hover:text-primary-foreground"
                      title="View content"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>

                    <button
                      onClick={() => setEditingGen(item)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:border-[#567C8D]/30 hover:bg-[#567C8D]/10 hover:text-primary-foreground"
                      title="Edit content"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit
                    </button>

                    <button
                      onClick={() => handleCopy(item)}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-xs font-medium shadow-[var(--shadow-button)] transition-all duration-300 ${
                        copiedId === item.id
                          ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                          : "border-border bg-card text-muted-foreground hover:border-[#567C8D]/30 hover:bg-[#567C8D]/10 hover:text-primary-foreground"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-6 animate-fade-in">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Page <span className="text-foreground">{currentPage}</span> of <span className="text-foreground">{totalPages}</span>
              </div>
              
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-[var(--surface-card)] py-24 animate-fade-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#567C8D]/8">
            <FolderOpen className="h-9 w-9 text-primary-foreground/60" />
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
              setCurrentPage(1);
            }}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-medium text-primary-foreground border-transparent transition-all duration-300 hover:shadow-md hover:border-transparent"
          >
            Clear All Filters
          </button>
        </div>
      )}

      {/* Delete Undo Toast */}
      {showDeleteToast && lastDeleted && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-4 shadow-xl animate-fade-in-up">
          <p className="text-sm text-foreground">
            Deleted <span className="font-semibold">{lastDeleted.title}</span>
          </p>
          <button
            onClick={handleRestore}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#567C8D]/15 px-3 py-1.5 text-xs font-medium text-primary-foreground transition-all hover:bg-[#567C8D]/25"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Undo
          </button>
          <button
            onClick={() => setShowDeleteToast(false)}
            className="rounded-lg p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* View Modal */}
      {viewingGen && (
        <ViewModal
          generation={viewingGen}
          onClose={() => setViewingGen(null)}
        />
      )}

      {/* Edit Modal */}
      {editingGen && (
        <EditModal
          generation={editingGen}
          onSave={updateGeneration}
          onClose={() => setEditingGen(null)}
        />
      )}

      {/* Import Modal */}
      {showImport && (
        <ImportModal
          onImport={importGeneration}
          onClose={() => setShowImport(false)}
        />
      )}
    </div>
  );
}
