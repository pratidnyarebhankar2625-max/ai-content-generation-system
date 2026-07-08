import {
  PenSquare,
  Mail,
  Megaphone,
  Briefcase,
  GraduationCap,
  Code2,
  Sparkles,
  Trash2,
} from "lucide-react";

type TemplateCardProps = {
  id: number;
  title: string;
  description: string;
  category: string;
  isUserTemplate?: boolean;
  onDelete?: (id: number) => void;
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

const badgeColors = {
  Writing: "bg-blue-100 text-blue-700",
  Email: "bg-green-100 text-green-700",
  "Social Media": "bg-pink-100 text-pink-700",
  Marketing: "bg-orange-100 text-orange-700",
  Business: "bg-violet-100 text-violet-700",
  Education: "bg-yellow-100 text-yellow-700",
  Developer: "bg-gray-200 text-gray-700",
  "AI Utility": "bg-cyan-100 text-cyan-700",
};

export default function TemplateCard({
  id,
  title,
  description,
  category,
  isUserTemplate = false,
  onDelete,
}: TemplateCardProps) {

  const Icon =
    categoryIcons[category as keyof typeof categoryIcons] || Sparkles;

  return (
    <div className="group rounded-xl border bg-card p-5 space-y-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Top Section */}
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-muted p-3">
          <Icon className="h-6 w-6 text-primary" />
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            badgeColors[category as keyof typeof badgeColors]
          }`}
        >
          {category}
        </span>
      </div>

      {/* Content */}
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="flex gap-2">

  <button className="flex-1 rounded-lg bg-primary py-2 text-primary-foreground transition hover:opacity-90">
    Use Template
  </button>

  {isUserTemplate && (
    <button
      onClick={() => onDelete?.(id)}
      className="rounded-lg border border-red-500 px-3 text-red-500 transition hover:bg-red-500 hover:text-white"
    >
      <Trash2 className="h-5 w-5" />
    </button>
  )}

</div>
    </div>
  );
}