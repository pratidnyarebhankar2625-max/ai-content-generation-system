"use client";

import { useContent, formatRelativeTime } from "@/lib/content-store";
import { useDashboard } from "@/lib/dashboard-store";
import ProjectCard from "./ProjectCard";
import { SkeletonProjectsList } from "./SkeletonCard";
import { FolderOpen } from "lucide-react";

export default function RecentProjects() {
  const { generations, isLoaded } = useContent();
  const { isLoading } = useDashboard();

  if (!isLoaded || isLoading) {
    return (
      <section>
        <h2 className="mb-8 font-heading text-[28px] font-bold tracking-tight animate-fade-in-up">
          Recent Projects
        </h2>
        <SkeletonProjectsList />
      </section>
    );
  }

  // Show the 4 most recent generations
  const recent = [...generations]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 4);

  if (recent.length === 0) {
    return (
      <section>
        <h2 className="mb-8 font-heading text-[28px] font-bold tracking-tight animate-fade-in-up">
          Recent Projects
        </h2>
        <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-[var(--surface-card)] py-16 animate-fade-in">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#D4A843]/8">
            <FolderOpen className="h-8 w-8 text-[#B8860B]/60" />
          </div>
          <h3 className="mt-5 font-heading text-xl font-semibold text-foreground">
            No projects yet
          </h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Generate your first content to see it here.
          </p>
        </div>
      </section>
    );
  }

  const statusMap: Record<string, string> = {
    completed: "Completed",
    draft: "Draft",
    failed: "Failed",
  };

  return (
    <section>
      <h2 className="mb-8 font-heading text-[28px] font-bold tracking-tight animate-fade-in-up">
        Recent Projects
      </h2>

      <div className="space-y-4">
        {recent.map((gen, index) => (
          <ProjectCard
            key={gen.id}
            title={gen.title}
            category={gen.category}
            status={statusMap[gen.status] || gen.status}
            time={formatRelativeTime(gen.createdAt)}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}