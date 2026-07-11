import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import {
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Moon,
  Sun,
  Mail,
  Smartphone,
  Key,
  Eye,
} from "lucide-react";

const settingSections = [
  {
    title: "Account",
    description: "Manage your account details and preferences",
    icon: User,
    items: [
      { label: "Edit Profile", description: "Update your name, bio, and avatar", icon: User },
      { label: "Email Address", description: "pratidnya@example.com", icon: Mail },
      { label: "Change Password", description: "Update your password", icon: Key },
    ],
  },
  {
    title: "Notifications",
    description: "Choose what notifications you receive",
    icon: Bell,
    items: [
      { label: "Email Notifications", description: "Receive updates via email", icon: Mail, toggle: true },
      { label: "Push Notifications", description: "Browser push notifications", icon: Smartphone, toggle: true },
      { label: "Generation Alerts", description: "Get notified when content is ready", icon: Bell, toggle: true },
    ],
  },
  {
    title: "Privacy & Security",
    description: "Control your privacy and security settings",
    icon: Shield,
    items: [
      { label: "Two-Factor Auth", description: "Add an extra layer of security", icon: Shield },
      { label: "Active Sessions", description: "Manage your active sessions", icon: Eye },
      { label: "Data & Privacy", description: "Download or delete your data", icon: Globe },
    ],
  },
  {
    title: "Appearance",
    description: "Customize how the app looks",
    icon: Palette,
    items: [
      { label: "Theme", description: "Light mode", icon: Sun },
      { label: "Language", description: "English (US)", icon: Globe },
    ],
  },
];

export default function SettingsPage() {
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
                <Settings className="h-6 w-6 text-[#1C1917]" />
              </div>
              <div className="space-y-1">
                <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">Settings</h1>
                <p className="text-[#87817B] text-base">Manage your account, notifications, and preferences.</p>
              </div>
            </div>

            {/* Settings Sections */}
            {settingSections.map((section, sectionIndex) => (
              <div
                key={section.title}
                className="rounded-[20px] border border-border bg-card p-7 shadow-[var(--shadow-card)] animate-fade-in-up"
                style={{ animationDelay: `${(sectionIndex + 1) * 100}ms` }}
              >
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#D4A843]/8">
                    <section.icon className="h-5 w-5 text-[#B8860B]" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-foreground">{section.title}</h2>
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {section.items.map((item, itemIndex) => (
                    <button
                      key={item.label}
                      className="group flex w-full items-center justify-between rounded-xl border border-border bg-[var(--surface-page)] p-4 text-left transition-all duration-300 hover:border-[#D4A843]/30 hover:bg-card hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] transition-colors duration-300 group-hover:bg-[#D4A843]/8">
                          <item.icon className="h-[18px] w-[18px] text-muted-foreground transition-colors duration-300 group-hover:text-[#B8860B]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        </div>
                      </div>

                      {'toggle' in item && item.toggle ? (
                        <div className="h-7 w-12 rounded-full bg-[#D4A843] p-0.5 transition-colors shadow-inner">
                          <div className="h-6 w-6 translate-x-5 rounded-full bg-white shadow-md transition-transform" />
                        </div>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#D4A843]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </>
  );
}