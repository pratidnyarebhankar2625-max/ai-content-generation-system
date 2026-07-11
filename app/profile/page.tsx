import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  FileText,
  Bot,
  Sparkles,
  Zap,
  Award,
  TrendingUp,
} from "lucide-react";

const stats = [
  { label: "Total Projects", value: "24", icon: FileText, trend: "+12%" },
  { label: "AI Generations", value: "152", icon: Bot, trend: "+18%" },
  { label: "Templates Used", value: "18", icon: Sparkles, trend: "+8%" },
  { label: "Active Streak", value: "7 days", icon: Zap, trend: null },
];

const recentActivity = [
  { action: "Generated blog post", template: "Blog Post Generator", time: "2 hours ago" },
  { action: "Created email campaign", template: "Email Campaign", time: "5 hours ago" },
  { action: "Used Instagram template", template: "Instagram Caption", time: "1 day ago" },
  { action: "Generated marketing copy", template: "Ad Copy", time: "2 days ago" },
  { action: "Created API documentation", template: "Technical Documentation", time: "3 days ago" },
];

export default function ProfilePage() {
  return (
    <>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-gradient-to-br from-[var(--surface-page)] via-[#F4F0EA] to-[var(--surface-page)] p-10">
          <div className="mx-auto max-w-4xl space-y-10 animate-fade-in">

            {/* Header */}
            <div className="flex items-center gap-3 animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A843] to-[#B8860B] shadow-lg shadow-[#D4A843]/20">
                <User className="h-6 w-6 text-[#1C1917]" />
              </div>
              <div className="space-y-1">
                <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">Profile</h1>
                <p className="text-[#87817B] text-base">Manage your profile and view your activity.</p>
              </div>
            </div>

            {/* Profile Card */}
            <div className="card-shimmer gold-glow relative overflow-hidden rounded-[20px] border border-border bg-card p-10 animate-fade-in-up stagger-1">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#D4A843]/5 blur-3xl" />

              <div className="relative flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1C1917] to-[#292524] text-3xl font-bold text-[#D4A843] shadow-lg">
                  PR
                </div>

                <div className="space-y-3">
                  <h2 className="font-heading text-2xl font-bold text-foreground">Pratidnya Rebhankar</h2>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      pratidnya@example.com
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      AI Developer
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined July 2025
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#D4A843]/8 border border-[#D4A843]/20 px-3 py-1.5 text-xs font-medium text-[#B8860B]">
                      <Award className="h-3.5 w-3.5" />
                      Pro Member
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                      <TrendingUp className="h-3.5 w-3.5" />
                      Active
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div
                  key={stat.label}
                  className="card-shimmer gold-glow rounded-[20px] border border-border bg-card p-6 transition-all duration-400 hover:-translate-y-1.5 hover:border-[#D4A843]/30 animate-fade-in-up"
                  style={{ animationDelay: `${(index + 2) * 80}ms` }}
                >
                  <div className="inline-flex items-center justify-center rounded-xl bg-[#D4A843]/8 p-2.5 text-[#B8860B]">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <p className="mt-3 font-heading text-[38px] font-bold leading-none tracking-tight text-foreground">{stat.value}</p>
                  <p className="mt-2 text-xs text-muted-foreground">{stat.label}</p>
                  {stat.trend && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                        <TrendingUp className="h-3 w-3" />
                        {stat.trend}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="rounded-[20px] border border-border bg-card p-7 animate-fade-in-up stagger-5">
              <h3 className="font-heading text-xl font-semibold text-foreground mb-5">Recent Activity</h3>

              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="group flex items-center justify-between rounded-xl border border-border bg-[var(--surface-page)] p-4 transition-all duration-300 hover:border-[#D4A843]/30 hover:bg-card hover:shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-medium text-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.template}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}