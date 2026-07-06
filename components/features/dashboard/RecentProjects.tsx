import ProjectCard from "./ProjectCard";

const projects = [
  {
    title: "Blog Generator",
    category: "Blog Writing",
    status: "Completed",
  },
  {
    title: "Instagram Caption",
    category: "Social Media",
    status: "Draft",
  },
  {
    title: "Product Description",
    category: "E-commerce",
    status: "Completed",
  },
  {
    title: "Email Writer",
    category: "Marketing",
    status: "In Progress",
  },
];

export default function RecentProjects() {
  return (
    <section className="mt-10">
      <h2 className="mb-6 text-2xl font-bold">
        Recent Projects
      </h2>

      <div className="space-y-4">
        {projects.map((project) => (
          <ProjectCard
            key={project.title}
            title={project.title}
            category={project.category}
            status={project.status}
          />
        ))}
      </div>
    </section>
  );
}