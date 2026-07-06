import {
  Plus,
  Bot,
  FolderOpen,
} from "lucide-react";

import QuickActionCard from "./QuickActionCard";

const actions = [
  {
    title: "New Project",
    description: "Start creating content",
    icon: <Plus className="h-8 w-8" />,
  },
  {
    title: "Generate Content",
    description: "Use AI to generate content",
    icon: <Bot className="h-8 w-8" />,
  },
  {
    title: "Browse Templates",
    description: "Choose from templates",
    icon: <FolderOpen className="h-8 w-8" />,
  },
];

export default function QuickActions() {
  return (
    <section className="mt-10">
      <h2 className="mb-6 text-2xl font-bold">
        Quick Actions
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {actions.map((action) => (
          <QuickActionCard
            key={action.title}
            title={action.title}
            description={action.description}
            icon={action.icon}
          />
        ))}
      </div>
    </section>
  );
}