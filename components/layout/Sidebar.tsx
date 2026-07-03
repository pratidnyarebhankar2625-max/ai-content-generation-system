import { Button } from "@/components/ui/button";

const menuItems = [
  { name: "Dashboard" },
  { name: "Templates" },
  { name: "History" },
  { name: "Profile" },
  { name: "Settings" },
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
            className="w-full justify-start"
          >
            {item.name}
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