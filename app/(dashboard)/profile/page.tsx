"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";
import { AvatarSelectionModal } from "@/components/ui/AvatarSelectionModal";
import { SettingsActionModal, type SettingsActionType } from "@/components/ui/SettingsActionModal";

import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Award,
  Shield,
  CheckCircle2,
  AlertCircle,
  Key,
  Smartphone,
  Globe,
  Monitor,
  Bell,
  ChevronRight,
  LogOut,
  Edit3,
  CreditCard,
  Lock
} from "lucide-react";

function ProfileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { settings, updateSettings } = useSettings();

  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [activeAction, setActiveAction] = useState<SettingsActionType>(null);

  const openModal = (action: SettingsActionType) => {
    setActiveAction(action);
    setActionModalOpen(true);
  };

  const displayName = user?.name || "User";
  const displayEmail = user?.email || "user@example.com";
  const displayInitials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const isVerified = user?.isVerified ?? false;
  const provider = user?.provider || "credentials";
  const joinedDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "July 2025";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/20">
          <User className="h-6 w-6 text-primary-foreground" />
        </div>
        <div className="space-y-1">
          <h1 className="font-heading text-[32px] md:text-[40px] font-bold tracking-tight leading-[1.1] text-foreground">
            Account Settings
          </h1>
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Manage your profile, security, and preferences.
          </p>
        </div>
      </div>

      {/* Large Profile Card */}
      <div className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-8 md:p-10 animate-fade-in-up stagger-1 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#113680]/5 blur-3xl transition-opacity duration-500 group-hover:bg-[#113680]/10" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          <div className="relative">
            {user?.avatar ? (
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary shadow-xl overflow-hidden p-[3px]">
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  className="h-full w-full rounded-[21px] object-cover bg-white" 
                />
              </div>
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary text-4xl font-bold text-primary-foreground shadow-xl">
                {displayInitials}
              </div>
            )}
            <button 
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-background border border-border shadow-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <Edit3 className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-5 text-center md:text-left">
            <div>
              <h2 className="font-heading text-[28px] md:text-[32px] font-bold tracking-tight text-foreground">
                {displayName}
              </h2>
              <p className="text-muted-foreground text-lg">{displayEmail}</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <Award className="h-4 w-4" />
                Pro Member
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 px-4 py-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-700 dark:text-amber-400">
                  <AlertCircle className="h-4 w-4" />
                  Unverified
                </span>
              )}
            </div>
          </div>
          
          <div className="shrink-0 pt-2 md:pt-0">
            <button 
              onClick={() => setIsAvatarModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Grid Sections */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-2">
        
        {/* Account Details */}
        <div className="group rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10">
              <Briefcase className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Account Details</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Member Since</span>
              </div>
              <span className="text-sm text-muted-foreground">{joinedDate}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Login Method</span>
              </div>
              <span className="text-sm capitalize text-muted-foreground">{provider}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Current Plan</span>
              </div>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Pro</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="group rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10">
              <Lock className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Security</h3>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => openModal("Change Password")}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Password</p>
                  <p className="text-xs text-muted-foreground">Updated 3 months ago</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">2-Factor Auth</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Enabled</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
            <button 
              onClick={() => openModal("Active Sessions")}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Active Sessions</p>
                  <p className="text-xs text-muted-foreground">2 devices</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="group rounded-[20px] border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-500/10">
              <Monitor className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <h3 className="font-heading text-lg font-semibold text-foreground">Preferences</h3>
          </div>
          <div className="space-y-4">
            <button 
              onClick={() => router.push('/settings')}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Notifications</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-background rounded-md px-2 py-1 border border-border">
                {[settings?.email_notifications && "Email", settings?.push_notifications && "Push"].filter(Boolean).join(", ") || "None"}
              </span>
            </button>
            <button 
              onClick={() => updateSettings({ theme: settings?.theme === "dark" ? "light" : "dark" })}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Theme</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-background rounded-md px-2 py-1 border border-border capitalize">
                {settings?.theme || "System"}
              </span>
            </button>
            <button 
              onClick={() => openModal("Language")}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Language</span>
              </div>
              <span className="text-xs font-medium text-muted-foreground bg-background rounded-md px-2 py-1 border border-border">
                {settings?.language === "es-ES" ? "Español" : settings?.language === "fr-FR" ? "Français" : "English (US)"}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Danger Zone / Log Out */}
      <div className="flex justify-end pt-4 animate-fade-in-up stagger-3">
        <button 
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-500/10 px-6 py-3 text-sm font-medium text-red-600 dark:text-red-400 transition-all hover:bg-red-100 dark:hover:bg-red-500/20"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>

      {/* Modals */}
      <AvatarSelectionModal 
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
      <SettingsActionModal
        isOpen={actionModalOpen}
        onClose={() => setActionModalOpen(false)}
        action={activeAction}
      />
    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}