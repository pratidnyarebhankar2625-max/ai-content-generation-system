import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FileText,
  History,
  User,
  Settings,
  Sparkles,
  LogOut,
  ChevronRight,
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
    <aside className="flex h-screen w-72 flex-col border-r border-slate-800 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Logo */}
<div className="border-t border-slate-800 px-5 py-6">
  <div className="flex items-center gap-3">
    <div className="rounded-2xl bg-gradient-to-br from-indigo-500 via-violet-500 to-indigo-600 p-3 shadow-[0_0_25px_rgba(99,102,241,0.35)]">
      <Sparkles className="h-5 w-5 text-white" />
    </div>

    <div>
      <h1 className="text-lg font-bold tracking-tight text-white">
  AI Content Studio
</h1>

<p className="mt-1 text-xs tracking-wide text-slate-400">
  Smart Content Generation
</p>

    </div>
  </div>
</div>

      {/* Navigation */}
      <nav className="flex-1 space-y-2 px-4 py-8">
        {menuItems.map((item) => (
          <Button
            key={item.name}
            variant="ghost"
            className={`
relative
group
w-full
justify-between
rounded-xl
px-4
py-6
text-base
transition-all
duration-300
ease-out
hover:scale-[1.02]
${
  item.name === "Dashboard"
    ? "bg-indigo-600/90 text-white shadow-lg"
    : "text-slate-300 hover:bg-slate-900 hover:text-white"
}
`}
          >
            {item.name === "Dashboard" && (
  <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full bg-white/90" />
)}

<div className="flex items-center gap-3">
  <item.icon className="h-[22px] w-[22px]" />
  <span>{item.name}</span>
</div>

<ChevronRight className="h-4 w-4 opacity-30 transition-all group-hover:translate-x-1 group-hover:opacity-100" />

          </Button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-5">

  <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">

    <div className="flex items-center gap-3">

      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-lg font-semibold text-white shadow-md">
        P
      </div>

      <div>
        <h3 className="text-sm font-semibold text-white">
          Pratidnya
        </h3>

        <p className="text-xs text-slate-400">
          AI Developer
        </p>
      </div>

    </div>

    <Button
      variant="ghost"
      className="mt-5 w-full justify-center rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>

  </div>

</div>
    </aside>
  );
}