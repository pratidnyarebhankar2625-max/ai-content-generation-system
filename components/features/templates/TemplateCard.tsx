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
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition-all hover:shadow-md">
      <h3 className="text-xl font-semibold">{title}</h3>

      <p className="mt-2 text-muted-foreground">
        {description}
      </p>

      <span className="mt-4 inline-block rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
        {category}
      </span>

      <button className="mt-6 w-full rounded-xl bg-primary py-2 text-primary-foreground">
        Use Template
      </button>
    </div>
  );
}