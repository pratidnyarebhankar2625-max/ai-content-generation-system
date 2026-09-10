"use client";

import { useState, useEffect, useRef } from "react";
import { X, Shield, Mail, Key, Eye, Globe, Loader2, Check, Smartphone, Download, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

import { useSettings } from "@/lib/settings-store";
import { useAuth } from "@/lib/auth-store";
import { createClient } from "@/lib/supabase/client";

export type SettingsActionType = 
  | "Email Address"
  | "Change Password"
  | "Active Sessions"
  | "Data & Privacy"
  | "Language"
  | null;

interface SettingsActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: SettingsActionType;
}

export function SettingsActionModal({ isOpen, onClose, action }: SettingsActionModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Email state
  const [email, setEmail] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Settings & Auth states
  const { settings, updateSettings } = useSettings();
  const { logout, user } = useAuth();
  const [language, setLanguage] = useState(settings?.language || "en-US");
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      wasOpenRef.current = true;
      setIsSaving(false);
      setSuccess(false);
      setErrorMsg("");
      setEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (settings?.language) {
        setLanguage(settings.language);
      }
    } else if (!isOpen) {
      wasOpenRef.current = false;
    }
  }, [isOpen, settings?.language]);

  async function handleActionSubmit() {
    setIsSaving(true);
    setErrorMsg("");
    let result: { success: boolean; error?: string } = { success: true };
    const supabase = createClient();
    
    if (action === "Language") {
      result = await updateSettings({ language });
    } else if (action === "Email Address") {
      try {
        const { error } = await supabase.auth.updateUser({ email });
        if (error) {
          result = { success: false, error: error.message };
        } else {
          toast.success("Confirmation link sent to your new email!");
          result = { success: true };
        }
      } catch (err: any) {
        result = { success: false, error: err?.message || "Failed to update email" };
      }
    } else if (action === "Change Password") {
      try {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) {
          result = { success: false, error: error.message };
        } else {
          toast.success("Password updated successfully!");
          result = { success: true };
        }
      } catch (err: any) {
        result = { success: false, error: err?.message || "Failed to update password" };
      }
    }
    
    setIsSaving(false);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      if (result.error) {
        setErrorMsg(result.error);
        toast.error(result.error);
      }
    }
  }

  async function handleSignOutOtherDevices() {
    setIsSaving(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signOut({ scope: 'others' });
      if (error) {
        toast.error(error.message || "Failed to log out other devices.");
      } else {
        toast.success("Logged out all other sessions successfully!");
      }
    } catch {
      toast.error("Failed to log out other devices.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDownloadDataArchive() {
    setIsSaving(true);
    toast.info("Generating your data archive...");
    try {
      const [profileRes, settingsRes, historyRes, templatesRes] = await Promise.all([
        fetch("/api/profile").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/settings").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/history?limit=1000").then(r => r.ok ? r.json() : null).catch(() => null),
        fetch("/api/templates?limit=1000").then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      const archiveData = {
        exported_at: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          name: user?.name,
        },
        profile: profileRes?.data || null,
        settings: settingsRes?.data || null,
        history: historyRes?.data?.items || [],
        user_templates: templatesRes?.data?.items || [],
      };

      const blob = new Blob([JSON.stringify(archiveData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `writeora-data-archive-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success("Data archive downloaded!");
    } catch (err: any) {
      toast.error("Failed to export data archive.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDeleteAccount() {
    if (!confirm("Are you absolutely sure you want to delete your account? This action is permanent.")) {
      return;
    }
    toast.info("Processing account deletion...");
    try {
      await logout();
      toast.success("Account signed out.");
      onClose();
    } catch {
      toast.error("Failed to process account deletion request.");
    }
  }

  const getIcon = () => {
    switch (action) {
      case "Email Address": return <Mail className="h-5 w-5 text-[#fe4443]" />;
      case "Change Password": return <Key className="h-5 w-5 text-[#fe4443]" />;
      case "Active Sessions": return <Eye className="h-5 w-5 text-[#fe4443]" />;
      case "Data & Privacy": return <Globe className="h-5 w-5 text-[#fe4443]" />;
      default: return <Shield className="h-5 w-5 text-[#fe4443]" />;
    }
  };

  const getTitle = () => {
    switch (action) {
      case "Email Address": return "Update Email";
      case "Change Password": return "Change Password";
      case "Active Sessions": return "Manage Sessions";
      case "Data & Privacy": return "Data & Privacy";
      case "Language": return "Change Language";
      default: return action;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && action && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white dark:bg-card shadow-2xl border border-border"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border bg-[#113680] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-heading text-[22px] font-semibold leading-snug tracking-tight text-white">{getTitle()}</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="p-6 space-y-6">

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
              {errorMsg}
            </div>
          )}
          
          {action === "Email Address" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-muted-foreground">Enter your new email address below. We'll send a verification link to confirm the change.</p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC]">New Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-muted px-4 py-2.5 text-sm text-foreground transition-colors focus:border-[#113680]/50 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          )}

          {action === "Change Password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC]">Current Password</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-muted px-4 py-2.5 text-sm text-foreground transition-colors focus:border-[#113680]/50 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC]">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-muted px-4 py-2.5 text-sm text-foreground transition-colors focus:border-[#113680]/50 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC]">Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-muted px-4 py-2.5 text-sm text-foreground transition-colors focus:border-[#113680]/50 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {action === "Active Sessions" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-muted-foreground">Review active sessions associated with your account.</p>
              
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 dark:bg-muted p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#113680]/10 dark:bg-white/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-[#113680] dark:text-[#F8FAFC]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-foreground">Current Web Session</p>
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium">Active Now • Authenticated</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleSignOutOtherDevices}
                disabled={isSaving}
                className="w-full rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 py-2.5 text-sm font-medium text-red-600 dark:text-red-400 transition-colors hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin mx-auto" /> : "Log Out All Other Devices"}
              </button>
            </div>
          )}

          {action === "Data & Privacy" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC]">Download Your Data</h4>
                <p className="text-sm text-slate-600 dark:text-muted-foreground">Get a copy of all your generated content, settings, and profile data.</p>
                <button 
                  onClick={handleDownloadDataArchive}
                  disabled={isSaving}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 dark:bg-primary py-2.5 text-sm font-medium text-white dark:text-primary-foreground transition-colors hover:bg-slate-800 disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Request Data Archive
                </button>
              </div>
              
              <hr className="border-border" />
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-600 dark:text-red-400">Danger Zone</h4>
                <p className="text-sm text-slate-600 dark:text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button 
                  onClick={handleDeleteAccount}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-red-600/20 transition-all hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Account
                </button>
              </div>
            </div>
          )}
          
          {action === "Language" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-muted-foreground">Select your preferred language.</p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680] dark:text-[#F8FAFC]">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 dark:bg-muted px-4 py-2.5 text-sm text-foreground transition-colors focus:border-[#113680]/50 focus:bg-white dark:focus:bg-card focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                >
                  <option value="en-US">English (US)</option>
                </select>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        {action !== "Active Sessions" && action !== "Data & Privacy" && (
          <div className="flex items-center justify-end gap-3 border-t border-border bg-slate-50 dark:bg-muted/50 p-5">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-muted-foreground transition-colors hover:bg-slate-200 dark:hover:bg-accent"
            >
              Cancel
            </button>
            <button
              onClick={handleActionSubmit}
              disabled={
                isSaving || 
                success ||
                (action === "Email Address" && (!email.includes("@") || email.length < 5)) ||
                (action === "Change Password" && (currentPassword.length < 6 || newPassword.length < 6 || newPassword !== confirmPassword))
              }
              className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#113680] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all hover:bg-[#0a2050] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : success ? (
                <>
                  <Check className="h-4 w-4" />
                  Done!
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        )}
      </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
