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
  "AI Utility": "bg-[#113680]/10 text-[#113680] border-[#113680]/20",
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
      className="card-shimmer flex flex-col h-full group rounded-2xl border border-border/60 bg-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-[#113680]/30 hover:shadow-[0_12px_24px_-8px_rgba(17,54,128,0.15)] animate-fade-in-up"
      style={{ animationDelay: `${(index % 6) * 60}ms` }}
    >
      {/* Top Section */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#113680]/5 to-[#113680]/10 shadow-sm transition-transform duration-300 group-hover:scale-105 group-hover:shadow-md">
            <Icon className="h-6 w-6 text-[#113680]" />
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold tracking-wide ${
              badgeColors[category] || "bg-muted text-muted-foreground"
            }`}
          >
            {category}
          </span>
        </div>

        <button
          onClick={() => onFavorite?.(id)}
          className={`group/fav flex h-9 w-9 items-center justify-center rounded-full border border-transparent transition-all duration-300 ${
            isFavorite
              ? "bg-amber-50 text-amber-500 hover:bg-amber-100 border-amber-200/50"
              : "text-muted-foreground hover:bg-muted hover:text-amber-500"
          }`}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Star
            className={`h-[18px] w-[18px] transition-transform duration-300 group-hover/fav:scale-110 ${isFavorite ? "fill-current" : ""}`}
          />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-3">
        <h2 className="font-heading text-[22px] font-semibold leading-snug tracking-tight text-foreground group-hover:text-[#113680] transition-colors duration-300">
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">
          {description}
        </p>
      </div>

      {/* Footer / Buttons */}
      <div className="mt-6 space-y-4">
        {usageCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground/80">
            <Sparkles className="h-3.5 w-3.5 text-[#113680]/60" />
            Used {usageCount} {usageCount === 1 ? "time" : "times"}
          </div>
        )}
        
        <div className="flex gap-2">
          <button
            onClick={() => onUse?.(id)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#113680] py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:bg-[#113680]/90 hover:-translate-y-0.5 hover:shadow-md"
          >
            Use Template
          </button>

          {isUserTemplate && (
            <>
              <button
                onClick={() => onEdit?.(id)}
                className="flex items-center justify-center rounded-xl border border-border/80 bg-white px-3 text-muted-foreground shadow-sm transition-all duration-300 hover:bg-muted hover:text-[#113680] hover:-translate-y-0.5"
                title="Edit template"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete?.(id)}
                className="flex items-center justify-center rounded-xl border border-red-200/60 bg-white px-3 text-red-500 shadow-sm transition-all duration-300 hover:bg-red-50 hover:border-red-200 hover:-translate-y-0.5"
                title="Delete template"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}