"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-store";
import { useSettings } from "@/lib/settings-store";
import { AvatarSelectionModal } from "@/components/ui/AvatarSelectionModal";
import { SettingsActionModal, type SettingsActionType } from "@/components/ui/SettingsActionModal";
import { Skeleton } from "@/components/ui/skeleton";

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
  ChevronRight,
  LogOut,
  Edit3,
  CreditCard,
  Lock,
  Sparkles,
  MessageSquare
} from "lucide-react";

function ProfileContent() {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const { settings } = useSettings();

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

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-4 sm:p-6 md:p-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-2xl" />
          <div className="space-y-2">
            <Skeleton className="h-7 w-48 rounded-md" />
            <Skeleton className="h-4 w-36 rounded-md" />
          </div>
        </div>
        <Skeleton className="h-48 sm:h-64 w-full rounded-[24px]" />
        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
          <Skeleton className="h-40 w-full rounded-[24px]" />
          <Skeleton className="h-40 w-full rounded-[24px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 sm:space-y-8 p-4 sm:p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 animate-fade-in-up">
        <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary shadow-lg shadow-primary/20 shrink-0">
          <User className="h-5 w-5 sm:h-6 sm:w-6 text-primary-foreground" />
        </div>
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="font-heading text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground">
            Account Settings
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm md:text-base leading-relaxed">
            Manage your profile, security, and preferences.
          </p>
        </div>
      </div>

      {/* Large Profile Card */}
      <div className="group relative overflow-hidden rounded-[24px] border border-border bg-card p-5 sm:p-8 md:p-10 animate-fade-in-up stagger-1 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-64 w-64 rounded-full bg-[#113680]/5 blur-3xl transition-opacity duration-500 group-hover:bg-[#113680]/10" />
        
        <div className="relative flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          <div className="relative">
            {user?.avatar ? (
              <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary shadow-xl overflow-hidden p-[3px]">
                <img 
                  src={user.avatar} 
                  alt="Avatar" 
                  className="h-full w-full rounded-[21px] object-cover bg-white" 
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 sm:h-32 sm:w-32 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary text-3xl sm:text-4xl font-bold text-primary-foreground shadow-xl">
                {displayInitials}
              </div>
            )}
            <button 
              onClick={() => setIsAvatarModalOpen(true)}
              className="absolute -bottom-2 -right-2 sm:-bottom-3 sm:-right-3 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-background border border-border shadow-sm text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
            >
              <Edit3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>

          <div className="flex-1 space-y-3 sm:space-y-5 text-center md:text-left">
            <div>
              <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                {displayName}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base md:text-lg">{displayEmail}</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-primary">
                <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Pro Member
              </span>
              {isVerified ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Verified
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 border border-amber-100 px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold text-amber-700">
                  <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Unverified
                </span>
              )}
            </div>
          </div>
          
          <div className="shrink-0 pt-1 md:pt-0">
            <button 
              onClick={() => setIsAvatarModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-medium text-muted-foreground shadow-sm transition-all hover:bg-muted hover:text-foreground"
            >
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      {/* Grid Sections */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 animate-fade-in-up stagger-2">
        
        {/* Account Details */}
        <div className="group rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-blue-50 shrink-0">
              <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            </div>
            <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Account Details</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Member Since</span>
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">{joinedDate}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Login Method</span>
              </div>
              <span className="text-xs sm:text-sm capitalize text-muted-foreground">{provider}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-muted/30 p-3">
              <div className="flex items-center gap-3">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Current Plan</span>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-blue-600">Pro</span>
            </div>
          </div>
        </div>

        {/* Security */}
        <div className="group rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-emerald-50 shrink-0">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-600" />
            </div>
            <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Security</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <button 
              onClick={() => openModal("Change Password")}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Key className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Password</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">Updated 3 months ago</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
            <button className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50">
              <div className="flex items-center gap-3">
                <Smartphone className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-medium text-foreground">2-Factor Auth</p>
                  <p className="text-[11px] sm:text-xs text-emerald-600 font-medium">Enabled</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
            <button 
              onClick={() => openModal("Active Sessions")}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="text-left">
                  <p className="text-xs sm:text-sm font-medium text-foreground">Active Sessions</p>
                  <p className="text-[11px] sm:text-xs text-muted-foreground">2 devices</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </button>
          </div>
        </div>

        {/* Preferences */}
        <div className="group rounded-[20px] border border-border bg-card p-5 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md">
          <div className="mb-4 sm:mb-6 flex items-center gap-3">
            <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-purple-50 shrink-0">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
            </div>
            <h3 className="font-heading text-base sm:text-lg font-semibold text-foreground">Preferences</h3>
          </div>
          <div className="space-y-3 sm:space-y-4">
            <button 
              onClick={() => router.push('/settings')}
              className="flex w-full items-center justify-between rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-foreground">Writing Tone</span>
              </div>
              <span className="text-xs font-medium capitalize text-muted-foreground bg-background rounded-md px-2 py-1 border border-border">
                {settings?.writing_tone || "Professional"}
              </span>
            </button>
          </div>
        </div>

      </div>

      {/* Danger Zone / Log Out */}
      <div className="flex justify-end pt-2 sm:pt-4 animate-fade-in-up stagger-3">
        <button 
          onClick={logout}
          className="inline-flex items-center gap-2 rounded-xl bg-red-50 px-5 py-2.5 sm:px-6 sm:py-3 text-xs sm:text-sm font-medium text-red-600 transition-all hover:bg-red-100"
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