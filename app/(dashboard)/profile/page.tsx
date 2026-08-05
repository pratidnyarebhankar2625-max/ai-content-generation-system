"use client";
import { useState } from "react";

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

  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 p-6 md:p-8 animate-fade-in">

            {/* Header */}
            <div className="flex items-center gap-3 animate-fade-in-up">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113680] to-[#113680] shadow-lg shadow-[#113680]/20">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="space-y-1">
                <h1 className="font-heading text-[40px] md:text-[56px] font-bold tracking-tight leading-[1.1] text-foreground">Profile</h1>
                <p className="text-muted-foreground text-base leading-relaxed">Manage your profile and view your activity.</p>
              </div>
            </div>

            {/* Profile Card */}
            <div 
              onClick={() => setIsExpanded(!isExpanded)}
              className="group card-shimmer primary-glow relative overflow-hidden rounded-[20px] border border-border bg-card p-6 md:p-8 animate-fade-in-up stagger-1 cursor-pointer transition-all duration-300 hover:shadow-lg"
            >
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-[#113680]/5 blur-3xl transition-opacity duration-300 group-hover:bg-[#113680]/10" />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-6">
                {user?.avatar ? (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113680] to-[#3b82f6] shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-[1.02] overflow-hidden p-0.5">
                    <img 
                      src={user.avatar} 
                      alt="Avatar" 
                      className="h-full w-full rounded-[14px] object-cover bg-white" 
                    />
                  </div>
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113680] to-[#3b82f6] text-3xl font-bold text-white shadow-lg shrink-0 transition-transform duration-300 group-hover:scale-[1.02]">
                    {displayInitials}
                  </div>
                )}

                <div className="space-y-3 flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="font-heading text-[22px] font-semibold leading-snug tracking-tight text-foreground">{displayName}</h2>
                    <span className="text-xs font-semibold text-[#113680] dark:text-[#F8FAFC] bg-[#113680]/10 dark:bg-[#F8FAFC]/10 px-3 py-1.5 rounded-full transition-colors group-hover:bg-[#113680]/20 dark:group-hover:bg-[#F8FAFC]/20">
                      {isExpanded ? "Hide Details" : "View Details"}
                    </span>
                  </div>
                  
                  {!isExpanded && (
                    <p className="text-sm text-foreground/70">Click to view email, account type, and join date.</p>
                  )}

                  {isExpanded && (
                    <div className="animate-fade-in-down space-y-4 pt-4 mt-4 border-t border-border/50">
                      <div className="flex flex-col gap-3.5 text-sm text-foreground/70">
                        <span className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#113680]/5 dark:bg-[#F8FAFC]/10">
                            <Mail className="h-4 w-4 text-[#113680] dark:text-[#F8FAFC]" />
                          </div>
                          <span className="font-medium text-foreground w-28">Email:</span> 
                          <span className="text-foreground">{displayEmail}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#113680]/5 dark:bg-[#F8FAFC]/10">
                            <Briefcase className="h-4 w-4 text-[#113680] dark:text-[#F8FAFC]" />
                          </div>
                          <span className="font-medium text-foreground w-28">Account Type:</span> 
                          <span className="text-foreground">{provider === "google" ? "Google Account" : "AI Developer"}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#113680]/5 dark:bg-[#F8FAFC]/10">
                            <Calendar className="h-4 w-4 text-[#113680] dark:text-[#F8FAFC]" />
                          </div>
                          <span className="font-medium text-foreground w-28">Joined:</span> 
                          <span className="text-foreground">{joinedDate}</span>
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 pt-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#113680]/8 dark:bg-[#F8FAFC]/10 border border-[#113680]/20 dark:border-[#F8FAFC]/20 px-3 py-1.5 text-xs font-medium text-[#113680] dark:text-[#F8FAFC]">
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
                  )}
                </div>
              </div>
            </div>


    </div>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}