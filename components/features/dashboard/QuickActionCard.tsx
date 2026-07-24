type QuickActionCardProps = {
  title: string;
  description: string;
  icon: React.ReactNode;
  index?: number;
  onClick?: () => void;
};

export default function QuickActionCard({
  title,
  description,
  icon,
  index = 0,
  onClick,
}: QuickActionCardProps) {
  return (
    <button
      onClick={onClick}
      className="
        card-shimmer
        primary-glow
        group
        relative
        flex
        flex-col
        items-start
        gap-4
        rounded-[20px]
        border
        border-border
        bg-card
        p-7
        text-left
        transition-all
        duration-400
        hover:-translate-y-1.5
        hover:border-[#567C8D]/30
        animate-fade-in-up
      "
      style={{ animationDelay: `${(index + 1) * 80}ms` }}
    >
      {/* Gold accent strip on hover */}
      <div className="absolute left-0 top-4 bottom-4 w-0.5 rounded-r-full bg-[#567C8D] opacity-0 transition-all duration-400 group-hover:opacity-100" />

      <div className="inline-flex items-center justify-center rounded-2xl bg-[#567C8D]/8 p-3.5 text-[#567C8D] transition-colors duration-300 group-hover:bg-[#567C8D]/15 group-hover:text-[#567C8D]">
        {icon}
      </div>

      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold text-foreground">
          {title}
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </button>
  );
}