type QuickActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

export default function QuickActionCard({
  title,
  description,
  icon,
}: QuickActionCardProps) {
  return (
    <button
      className="
        flex
        flex-col
        items-start
        gap-3
        rounded-2xl
        border
        bg-white
        p-6
        text-left
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-md
      "
    >
      <div className="text-primary">
        {icon}
      </div>

      <div>
        <h3 className="font-semibold">
          {title}
        </h3>

        <p className="mt-1 text-sm text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}