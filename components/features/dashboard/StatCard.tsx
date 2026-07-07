type StatCardProps = {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
};

export default function StatCard({
  title,
  value,
  change,
  icon,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
      <div className="text-3xl">
        {icon}
      </div>

      <h3 className="mt-5 text-sm font-medium text-muted-foreground">
        {title}
      </h3>

      <h2 className="mt-2 text-3xl font-bold tracking-tight">
        {value}
      </h2>

      <div className="mt-2 text-xs text-muted-foreground">
        {change}
      </div>
    </div>
  );
}