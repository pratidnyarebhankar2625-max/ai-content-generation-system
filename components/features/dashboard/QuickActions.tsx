import {
  Plus,
  Bot,
  FolderOpen,
} from "lucide-react";

import QuickActionCard from "./QuickActionCard";

const actions = [
  {
    title: "New Project",
    description: "Start creating content from scratch",
    icon: <Plus className="h-9 w-9" />,
  },
  {
    title: "Generate Content",
    description: "Use AI to generate amazing content",
    icon: <Bot className="h-9 w-9" />,
  },
  {
    title: "Browse Templates",
    description: "Choose from ready-made templates",
    icon: <FolderOpen className="h-9 w-9" />,
  },
];

export default function QuickActions() {
  return (
    <section>
      <h2 className="mb-8 font-heading text-[28px] font-bold tracking-tight animate-fade-in-up">
        Quick Actions
      </h2>

      <div className="grid gap-6 md:grid-cols-3">
        {actions.map((action, index) => (
          <QuickActionCard
            key={action.title}
            title={action.title}
            description={action.description}
            icon={action.icon}
            index={index}
          />
        ))}
      </div>
    </section>
  );
}