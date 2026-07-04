export default function QuickActions() {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-semibold">
        Quick Actions
      </h2>

      <div className="flex flex-wrap gap-4">
        <button className="rounded-lg border px-5 py-3 hover:bg-gray-100">
          ➕ New Project
        </button>

        <button className="rounded-lg border px-5 py-3 hover:bg-gray-100">
          🤖 Generate Content
        </button>

        <button className="rounded-lg border px-5 py-3 hover:bg-gray-100">
          📂 Browse Templates
        </button>
      </div>
    </section>
  );
}