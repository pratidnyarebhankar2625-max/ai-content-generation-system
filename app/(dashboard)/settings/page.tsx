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
  Sparkles,
  Globe,
  ChevronRight,
  Mail,
  Key,
  Eye,
  MessageSquare,
} from "lucide-react";

const settingSections = [
  {
    title: "Account",
    description: "Manage your account details and security",
    icon: User,
    items: [
      {
        label: "Edit Profile",
        description: "Update your name, bio, and avatar",
        icon: User,
      },
      {
        label: "Email Address",
        description: "Update your account email address",
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
    title: "AI Preferences",
    description: "Customize your default generation tone",
    icon: Sparkles,
    items: [
      {
        label: "Writing Tone",
        description: "Professional",
        icon: MessageSquare,
      },
    ],
  },
  {
    title: "Privacy & Security",
    description: "Control your privacy and session security",
    icon: Shield,
    items: [
      {
        label: "Active Sessions",
        description: "Manage your active browser sessions",
        icon: Eye,
      },
      {
        label: "Data & Privacy",
        description: "Download data archive or delete account",
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
      <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 sm:space-y-6 md:space-y-8 p-4 sm:p-6 md:p-8 animate-fade-in">
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
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/20 shrink-0">
          <Settings className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>

        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="font-heading text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-tight text-foreground">
            Settings
          </h1>

          <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
            Manage your account, preferences, and security.
          </p>
        </div>
      </div>

      {/* Settings Sections */}
      {settingSections.map((section, sectionIndex) => (
        <div
          key={section.title}
          className="rounded-[20px] border border-border bg-card p-4 sm:p-6 md:p-7 shadow-[var(--shadow-card)] animate-fade-in-up"
          style={{
            animationDelay: `${(sectionIndex + 1) * 100}ms`,
          }}
        >
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-[#113680]/8 shrink-0">
              <section.icon className="h-4 w-4 sm:h-5 sm:w-5 text-[#113680]" />
            </div>

            <div>
              <h2 className="font-heading text-lg sm:text-xl font-semibold leading-snug tracking-tight text-foreground">
                {section.title}
              </h2>

              <p className="text-xs sm:text-sm font-medium text-muted-foreground">
                {section.description}
              </p>
            </div>
          </div>

          <div className="space-y-2 sm:space-y-2.5">
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
                className="group flex w-full items-center justify-between rounded-xl border border-border bg-[var(--surface-page)] p-3 sm:p-4 text-left transition-all duration-300 hover:border-[#113680]/30 hover:bg-card hover:shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#113680]/40"
              >
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-[var(--muted)] transition-colors duration-300 group-hover:bg-[#113680]/8 shrink-0">
                    <item.icon className="h-4 w-4 sm:h-[18px] sm:w-[18px] text-foreground/70 transition-colors duration-300 group-hover:text-[#113680]" />
                  </div>

                  <div className="min-w-0 truncate">
                    <p className="text-xs sm:text-sm font-medium text-foreground">
                      {item.label}
                    </p>

                    <p className="text-[11px] sm:text-xs text-foreground/70 truncate">
                      {item.label === "Edit Profile" && user?.name
                        ? `Update ${user.name}'s profile`
                        : item.label === "Email Address" && user?.email
                          ? user.email
                          : item.label === "Writing Tone" && settings?.writing_tone
                            ? settings.writing_tone
                            : item.description}
                    </p>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-foreground/70 shrink-0 transition-all duration-300 group-hover:translate-x-1 group-hover:text-[#113680]" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}