import { ArrowRight, CheckCircle2, Pencil, Loader2 } from "lucide-react";

type ProjectCardProps = {
  title: string;
  category: string;
  status: string;
  time?: string;
  index?: number;
};

const statusConfig: Record<string, { icon: React.ReactNode; className: string }> = {
  Completed: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: "bg-emerald-50/80 text-emerald-700 border-emerald-100",
  },
  Draft: {
    icon: <Pencil className="h-3.5 w-3.5" />,
    className: "bg-amber-50/80 text-amber-700 border-amber-100",
  },
  "In Progress": {
    icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
    className: "bg-[#567C8D]/8 text-[#567C8D] border-[#567C8D]/20",
  },
};

export default function ProjectCard({
  title,
  category,
  status,
  time,
  index = 0,
}: ProjectCardProps) {
  const config = statusConfig[status] || {
    icon: null,
    className: "bg-muted text-muted-foreground",
  };

  return (
    <div
      className="
        card-shimmer
        primary-glow
        group
        flex
        items-center
        justify-between
        rounded-[20px]
        border
        border-border
        bg-card
        p-6
        transition-all
        duration-400
        hover:-translate-y-1
        hover:border-[#567C8D]/30
        animate-fade-in-up
      "
      style={{ animationDelay: `${(index + 1) * 70}ms` }}
    >
      <div className="space-y-1.5">
        <h3 className="font-semibold text-lg text-foreground">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground">
          {category}{time ? ` · ${time}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium ${config.className}`}>
          {config.icon}
          {status}
        </span>

        <ArrowRight className="h-5 w-5 text-muted-foreground transition-all duration-300 group-hover:text-[#567C8D] group-hover:translate-x-1" />
      </div>
    </div>
  );
}