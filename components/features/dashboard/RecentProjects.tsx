const projects = [
  "Blog Generator",
  "Instagram Caption",
  "Product Description",
  "Email Writer",
];

export default function RecentProjects() {
  return (
    <section className="mt-8">
      <h2 className="mb-4 text-2xl font-semibold">
        Recent Projects
      </h2>

      <div className="rounded-lg border p-6">
        <ul className="space-y-3">
  {projects.map((project) => (
    <li
      key={project}
      className="rounded-md border p-3 hover:bg-gray-50"
    >
      {project}
    </li>
  ))}
</ul>
        
      </div>
    </section>
  );
}