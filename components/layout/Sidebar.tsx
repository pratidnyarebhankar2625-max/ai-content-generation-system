import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  History,
  User,
  Settings,
} from "lucide-react";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Templates",
    icon: FileText,
  },
  {
    name: "History",
    icon: History,
  },
  {
    name: "Profile",
    icon: User,
  },
  {
    name: "Settings",
    icon: Settings,
  },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-background">
      {/* Header */}
      <div className="border-b border-border p-6">
        <h2 className="text-lg font-semibold text-primary">
          Dashboard
        </h2>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 p-4">
        {menuItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className={`
w-full
justify-start
gap-3
rounded-xl
px-4
py-6
text-base
transition-all
duration-200
${
  item.name === "Dashboard"
    ? "bg-muted font-semibold"
    : "hover:bg-muted"
}
`}
          >
            <>
  <item.icon className="mr-3 h-4 w-4" />
  {item.name}
</>
          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border p-4">
        <Button
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700"
        >
          Logout
        </Button>
      </div>
    </aside>
  );
}