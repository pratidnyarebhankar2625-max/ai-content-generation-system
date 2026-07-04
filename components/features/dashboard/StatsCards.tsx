const stats = [
  {
    title: "Total Projects",
    value: "24",
    icon: "📁",
  },
  {
    title: "AI Generations",
    value: "152",
    icon: "🤖",
  },
  {
    title: "Templates Used",
    value: "18",
    icon: "📝",
  },
  {
    title: "Active Projects",
    value: "7",
    icon: "⚡",
  },
];
export default function StatsCards() {
  return (
    <section>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => (
                <div key={stat.title}>
                    <div className="rounded-lg border bg-white p-6 shadow-sm">
  <div className="text-3xl">
    {stat.icon}
  </div>

  <h3 className="mt-4 text-sm text-gray-500">
    {stat.title}
  </h3>

  <p className="mt-2 text-3xl font-bold">
    {stat.value}
  </p>
</div>

</div>


            ))}

</div>

    </section>
  );
}