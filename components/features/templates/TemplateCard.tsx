import {
  PenSquare,
  Mail,
  Megaphone,
  Briefcase,
  GraduationCap,
  Code2,
  Sparkles,
  Trash2,
  Star,
  Edit3,
} from "lucide-react";

type TemplateCardProps = {
  id: number;
  title: string;
  description: string;
  category: string;
  isUserTemplate?: boolean;
  isFavorite?: boolean;
  usageCount?: number;
  onFavorite?: (id: number) => void;
  onUse?: (id: number) => void;
  onEdit?: (id: number) => void;
  onDelete?: (id: number) => void;
  index?: number;
};

const categoryIcons = {
  Writing: PenSquare,
  Email: Mail,
  "Social Media": Megaphone,
  Marketing: Megaphone,
  Business: Briefcase,
  Education: GraduationCap,
  Developer: Code2,
  "AI Utility": Sparkles,
};

const badgeColors: Record<string, string> = {
  Writing: "bg-blue-50/80 text-blue-700 border-blue-100",
  Email: "bg-emerald-50/80 text-emerald-700 border-emerald-100",
  "Social Media": "bg-rose-50/80 text-rose-700 border-rose-100",
  Marketing: "bg-amber-50/80 text-amber-700 border-amber-100",
  Business: "bg-violet-50/80 text-violet-700 border-violet-100",
  Education: "bg-sky-50/80 text-sky-700 border-sky-100",
  Developer: "bg-stone-50/80 text-stone-700 border-stone-100",
  "AI Utility": "bg-[#567C8D]/8 text-secondary border-[#567C8D]/20",
};

export default function TemplateCard({
  id,
  title,
  description,
  category,
  isUserTemplate = false,
  isFavorite = false,
  usageCount = 0,
  onFavorite,
  onUse,
  onEdit,
  onDelete,
  index = 0,
}: TemplateCardProps) {

  const Icon =
    categoryIcons[category as keyof typeof categoryIcons] || Sparkles;

  return (
    <div
      className="card-shimmer primary-glow group rounded-[20px] border border-border bg-card p-6 space-y-5 transition-all duration-400 hover:-translate-y-1.5 hover:border-[#567C8D]/30 animate-fade-in-up"
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <div className="rounded-2xl bg-[var(--muted)] p-3.5 transition-colors duration-300 group-hover:bg-[#567C8D]/10">
          <Icon className="h-7 w-7 text-secondary" />
        </div>

        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${
            badgeColors[category] || "bg-muted text-muted-foreground"
          }`}
        >
          <Icon className="h-3 w-3" />
          {category}
        </span>
        <button
          onClick={() => onFavorite?.(id)}
          className={`rounded-full p-2 transition-colors duration-300 ${
            isFavorite
              ? "text-yellow-500 hover:text-yellow-600"
              : "text-muted-foreground hover:text-yellow-500"
          }`}
        >
          <Star
            className="h-5 w-5"
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {/* Content */}
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Used {usageCount} {usageCount === 1 ? "time" : "times"}
        </p>
      </div>

      <div className="flex gap-2.5">

  <button 
    onClick={() => onUse?.(id)}
    className="flex-1 rounded-xl bg-primary py-3 text-sm font-medium text-primary-foreground transition-all duration-300 hover:shadow-md hover:shadow-primary/20"
  >
    Use Template
  </button>

  {isUserTemplate && (
    <>
      <button
        onClick={() => onEdit?.(id)}
        className="rounded-xl border border-border px-3.5 text-muted-foreground transition-all duration-300 hover:bg-muted hover:text-foreground"
      >
        <Edit3 className="h-5 w-5" />
      </button>
      <button
        onClick={() => onDelete?.(id)}
        className="rounded-xl border border-red-200 px-3.5 text-red-400 transition-all duration-300 hover:bg-red-50 hover:text-red-500 hover:border-red-300"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </>
  )}

</div>
    </div>
  );
}