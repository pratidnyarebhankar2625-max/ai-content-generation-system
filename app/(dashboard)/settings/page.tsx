"use client";

import { useState } from "react";

import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";

import { AvatarSelectionModal } from "@/components/ui/AvatarSelectionModal";
import {
  SettingsActionModal,
  type SettingsActionType,
} from "@/components/ui/SettingsActionModal";

import { Skeleton } from "@/components/ui/skeleton";

import {
  Settings,
  User,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Mail,
  Key,
  Eye,
} from "lucide-react";

const settingSections = [
  {
    title: "Account",
    description: "Manage your account details and preferences",
    icon: User,
    items: [
      {
        label: "Edit Profile",
        description: "Update your name, bio, and avatar",
        icon: User,
      },
      {
        label: "Email Address",
        description: "pratidnya@example.com",
        icon: Mail,
      },
      {
        label: "Change Password",
        description: "Update your password",
        icon: Key,
      },
    ],
  },
  {
    title: "Privacy & Security",
    description: "Control your privacy and security settings",
    icon: Shield,
    items: [
      {
        label: "Active Sessions",
        description: "Manage your active sessions",
        icon: Eye,
      },
      {
        label: "Data & Privacy",
        description: "Download or delete your data",
        icon: Globe,
      },
    ],
  },
  {
    title: "Appearance & Localization",
    description: "Customize regional and language preferences",
    icon: Palette,
    items: [
      {
        label: "Language",
        description: "English (US)",
        icon: Globe,
      },
    ],
  },
];

export default function SettingsPage() {
  const { user } = useAuth();
  const { settings, isLoading } = useSettings();

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SettingsActionType>(null);

  const openModal = (action: SettingsActionType) => {
    setActiveAction(action);
    setActionModalOpen(true);
  };

  const handleAction = (label: string) => {
    if (label === "Edit Profile") {
      setIsAvatarModalOpen(true);
    } else {
      openModal(label as SettingsActionType);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-12 w-12 rounded-2xl" />

          <div className="space-y-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-4 w-48 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-48 w-full rounded-[24px]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-8 animate-fade-in">
      <AvatarSelectionModal
        isOpen={isAvatarModalOpen}
        onClose={() =>
          setIsAvatarModalOpen(false)
        }
      />

      <SettingsActionModal
        isOpen={actionModalOpen}
        onClose={() =>
          setActionModalOpen(false)
        }
        action={activeAction}
      />

      {/* Header */}

      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/20">
          <Settings className="h-6 w-6 text-primary-foreground" />
        </div>

        <div className="space-y-1">
          <h1 className="font-heading text-[40px] md:text-[56px] font-bold tracking-tight leading-[1.1] text-foreground">
            Settings
          </h1>

          <p className="text-muted-foreground text-base leading-relaxed">
            Manage your account, privacy, and preferences.
          </p>
        </div>
      </div>

      {/* Settings Sections */}

      {settingSections.map(
        (section, sectionIndex) => (
          <div
            key={section.title}
            className="rounded-[20px] border border-border bg-card p-7 shadow-[var(--shadow-card)] animate-fade-in-up"
            style={{
              animationDelay: `${(sectionIndex + 1) * 100
                }ms`,
            }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#113680]/8 dark:bg-[#F8FAFC]/10">
                <section.icon className="h-5 w-5 text-[#113680] dark:text-[#F8FAFC]" />
              </div>

              <div>
                <h2 className="font-heading text-[22px] font-semibold leading-snug tracking-tight text-foreground">
                  {section.title}
                </h2>

                <p className="text-sm font-medium text-muted-foreground">
                  {section.description}
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              {section.items.map((item) => (
                <div
                  key={item.label}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleAction(item.label)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleAction(item.label);
                    }
                  }}
                  className="group flex w-full items-center justify-between rounded-xl border border-border bg-[var(--surface-page)] p-4 text-left transition-all duration-300 hover:border-[#113680]/30 dark:hover:border-[#F8FAFC]/30 hover:bg-card hover:shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#113680]/40"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--muted)] transition-colors duration-300 group-hover:bg-[#113680]/8 dark:group-hover:bg-[#F8FAFC]/10">
                      <item.icon className="h-[18px] w-[18px] text-foreground/70 transition-colors duration-300 group-hover:text-[#113680] dark:group-hover:text-[#F8FAFC]" />
                    </div>

                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {item.label}
                      </p>

                      <p className="text-xs text-foreground/70">
                        {item.label === "Edit Profile" && user?.name
                          ? `Update ${user.name}'s profile`
                          : item.label === "Email Address" && user?.email
                            ? user.email
                            : item.label === "Language" && settings?.language
                              ? settings.language
                              : item.description}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="h-4 w-4 text-foreground/70 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#113680] group-hover:dark:text-[#F8FAFC]" />
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}