type TemplateCardProps = {
  title: string;
  description: string;
  category: string;
};

export default function TemplateCard({
  title,
  description,
  category,
}: TemplateCardProps) {
  return (
    <div className="group rounded-xl border bg-card p-5 space-y-4 transition hover:shadow-lg">

      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-muted p-3">
          ✨
        </div>

        <span className="rounded-full bg-muted px-3 py-1 text-xs">
          {category}
        </span>
      </div>


      <div>
        <h2 className="text-xl font-semibold">
          {title}
        </h2>

        <p className="mt-2 text-sm text-muted-foreground">
          {description}
        </p>
      </div>


      <button className="w-full rounded-lg bg-primary py-2 text-primary-foreground transition hover:opacity-90">
        Use Template
      </button>

    </div>
  );
}