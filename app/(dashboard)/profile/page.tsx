"use client";


import { useAuth } from "@/lib/auth-store";
import {
  User,
  Mail,
  Briefcase,
  Calendar,
  Award,
  Shield,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
function ProfileContent() {
  const { user } = useAuth();

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
    <div className="mx-auto max-w-4xl space-y-10 p-10 animate-fade-in">

            {/* Header */}
            <div className="flex items-center gap-3 animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#567C8D] to-[#567C8D] shadow-lg shadow-[#567C8D]/20">
                <User className="h-6 w-6 text-[#2F4156]" />
              </div>
              <div className="space-y-1">
                <h1 className="font-heading text-3xl md:text-[50px] font-bold tracking-tight leading-tight text-foreground">Profile</h1>
                <p className="text-muted-foreground text-base">Manage your profile and view your activity.</p>
              </div>
            </div>

            {/* Profile Card */}
            <div className="card-shimmer primary-glow relative overflow-hidden rounded-[20px] border border-border bg-card p-10 animate-fade-in-up stagger-1">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#567C8D]/5 blur-3xl" />

              <div className="relative flex items-center gap-6">
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2F4156] to-[#C8D9E6] text-3xl font-bold text-[#567C8D] shadow-lg">
                  {displayInitials}
                </div>

                <div className="space-y-3">
                  <h2 className="font-heading text-2xl font-bold text-foreground">{displayName}</h2>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Mail className="h-4 w-4" />
                      {displayEmail}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Briefcase className="h-4 w-4" />
                      {provider === "google" ? "Google Account" : "AI Developer"}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Joined {joinedDate}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#567C8D]/8 border border-[#567C8D]/20 px-3 py-1.5 text-xs font-medium text-[#567C8D]">
                      <Award className="h-3.5 w-3.5" />
                      Pro Member
                    </span>
                    {isVerified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/80 border border-amber-100 px-3 py-1.5 text-xs font-medium text-amber-700">
                        <AlertCircle className="h-3.5 w-3.5" />
                        Unverified
                      </span>
                    )}
                    {provider === "google" && (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/80 border border-blue-100 px-3 py-1.5 text-xs font-medium text-blue-700">
                        <Shield className="h-3.5 w-3.5" />
                        Google
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>


    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}