"use client";

import {
  Plus,
  Bot,
  FolderOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";

import QuickActionCard from "./QuickActionCard";

const actions = [
  {
    title: "New Project",
    description: "Start creating content from scratch",
    icon: <Plus className="h-9 w-9" />,
  },
];

export default function QuickActions() {
  const router = useRouter();

  return (
    <section>
      <h2 className="mb-8 font-heading text-[28px] font-bold tracking-tight animate-fade-in-up">
        Quick Actions
      </h2>

      <div className="grid gap-6 grid-cols-1">
        {actions.map((action, index) => (
          <QuickActionCard
            key={action.title}
            title={action.title}
            description={action.description}
            icon={action.icon}
            index={index}
            onClick={() => router.push("/templates")}
          />
        ))}
      </div>
    </section>
  );
}