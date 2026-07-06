import { ArrowRight } from "lucide-react";

type ProjectCardProps = {
  title: string;
  category: string;
  status: string;
};

export default function ProjectCard({
  title,
  category,
  status,
}: ProjectCardProps) {
  return (
    <div
      className="
        flex
        items-center
        justify-between
        rounded-xl
        border
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-md
      "
    >
      <div>
        <h3 className="font-semibold text-lg">
          {title}
        </h3>

        <p className="text-sm text-muted-foreground mt-1">
          {category}
        </p>
      </div>

      <div className="flex items-center gap-4">
        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
          {status}
        </span>

        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </div>
  );
}