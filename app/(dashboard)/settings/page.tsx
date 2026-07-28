"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-store";
import { AvatarSelectionModal } from "@/components/ui/AvatarSelectionModal";
import { SettingsActionModal, type SettingsActionType } from "@/components/ui/SettingsActionModal";

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
      { label: "Active Sessions", description: "Manage your active sessions", icon: Eye },
      { label: "Data & Privacy", description: "Download or delete your data", icon: Globe },
    ],
  },
  {
    title: "Appearance",
    description: "Customize how the app looks",
    icon: Palette,
    items: [
      { label: "Dark Theme", description: "Toggle dark mode", icon: Moon, toggle: true },
      { label: "Language", description: "English (US)", icon: Globe },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SettingsActionType>(null);
  
  // States for toggles
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Email Notifications": true,
    "Push Notifications": false,
    "Generation Alerts": true,
    "Dark Theme": false,
  });

  const handleToggle = (label: string) => {
    setToggles(prev => {
      const newValue = !prev[label];
      
      if (label === "Dark Theme") {
        if (newValue) {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
      
      return { ...prev, [label]: newValue };
    });
  };

  const handleAction = (label: string) => {
    if (label === "Edit Profile") {
      setIsAvatarModalOpen(true);
    } else if (label === "Language") {
      console.log(`Action clicked: ${label}`);
    } else {
      setActiveAction(label as SettingsActionType);
      setActionModalOpen(true);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-10 p-10 animate-fade-in">
      <AvatarSelectionModal 
        isOpen={isAvatarModalOpen} 
        onClose={() => setIsAvatarModalOpen(false)} 
      />
      <SettingsActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        action={activeAction}
      />

            {/* Header */}
            <div className="flex items-center gap-3 animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113680] to-[#113680] shadow-lg shadow-[#113680]/20">
                <Settings className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">Settings</h1>
                <p className="text-foreground/70 text-base">Manage your account, notifications, and preferences.</p>
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
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#113680]/8 dark:bg-[#F8FAFC]/10">
                    <section.icon className="h-5 w-5 text-[#113680] dark:text-[#F8FAFC]" />
                  </div>
                  <div>
                    <h2 className="font-heading text-xl font-semibold text-foreground">{section.title}</h2>
                    <p className="text-sm text-foreground/70">{section.description}</p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {section.items.map((item, itemIndex) => (
                    <button
                      key={item.label}
                      onClick={() => 'toggle' in item ? handleToggle(item.label) : handleAction(item.label)}
                      className="group flex w-full items-center justify-between rounded-xl border border-border bg-[var(--surface-page)] p-4 text-left transition-all duration-300 hover:border-[#113680]/30 dark:hover:border-[#F8FAFC]/30 hover:bg-card hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] transition-colors duration-300 group-hover:bg-[#113680]/8 dark:group-hover:bg-[#F8FAFC]/10">
                          <item.icon className="h-[18px] w-[18px] text-foreground/70 transition-colors duration-300 group-hover:text-[#113680] dark:group-hover:text-[#F8FAFC]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.label}</p>
                          <p className="text-xs text-foreground/70">
                            {item.label === "Edit Profile" && user?.name 
                              ? `Update ${user.name}'s profile` 
                              : item.label === "Email Address" && user?.email 
                              ? user.email 
                              : item.description}
                          </p>
                        </div>
                      </div>

                      {'toggle' in item && item.toggle ? (
                        <div className={`h-7 w-12 rounded-full p-0.5 transition-colors shadow-inner ${toggles[item.label] ? 'bg-[#fe4443]' : 'bg-slate-200 dark:bg-slate-700'}`}>
                          <div className={`h-6 w-6 rounded-full bg-white shadow-md transition-transform ${toggles[item.label] ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-foreground/70 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#113680] dark:group-hover:text-[#F8FAFC]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
    </div>
  );
}