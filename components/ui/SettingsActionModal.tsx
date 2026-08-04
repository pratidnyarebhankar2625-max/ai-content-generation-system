import { useState, useEffect } from "react";
import { X, Shield, Mail, Key, Eye, Globe, Loader2, Check, Smartphone } from "lucide-react";

import { useSettings } from "@/lib/settings-store";

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

  // Email state
  const [email, setEmail] = useState("");

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Settings states
  const { settings, updateSettings } = useSettings();
  const [language, setLanguage] = useState(settings?.language || "en-US");

  useEffect(() => {
    if (isOpen) {
      setIsSaving(false);
      setSuccess(false);
      setEmail("");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      if (settings) {
        setLanguage(settings.language);
      }
    }
  }, [isOpen, settings]);

  if (!isOpen || !action) return null;

  async function handleActionSubmit() {
    setIsSaving(true);
    let result: { success: boolean; error?: string } = { success: true };
    
    if (action === "Language") {
      result = await updateSettings({ language });
    } else {
      // Mock for others
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setIsSaving(false);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } else {
      // Handle error visually if needed
      console.error(result.error);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-fade-in-up border border-border">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border bg-[#113680] p-5 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 shadow-inner">
              {getIcon()}
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold">{getTitle()}</h3>
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
          
          {action === "Email Address" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Enter your new email address below. We'll send a verification link to confirm the change.</p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680]">New Email Address</label>
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#113680]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="name@example.com"
                />
              </div>
            </div>
          )}

          {action === "Change Password" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680]">Current Password</label>
                <input 
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#113680]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680]">New Password</label>
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#113680]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="••••••••"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680]">Confirm New Password</label>
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#113680]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {action === "Active Sessions" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Review devices that are currently logged into your account.</p>
              
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="flex items-center justify-between bg-slate-50 p-4 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#113680]/10 flex items-center justify-center">
                      <Globe className="h-4 w-4 text-[#113680]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">Windows PC - Chrome</p>
                      <p className="text-xs text-green-600 font-medium">Active Now • Mumbai, India</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between bg-white p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center">
                      <Smartphone className="h-4 w-4 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900">iPhone 14 - Safari</p>
                      <p className="text-xs text-slate-500">Last active 2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <button className="w-full rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100">
                Log Out All Other Devices
              </button>
            </div>
          )}

          {action === "Data & Privacy" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-[#113680]">Download Your Data</h4>
                <p className="text-sm text-slate-600">Get a copy of all your generated content, settings, and profile data sent to your email.</p>
                <button className="mt-2 w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
                  Request Data Archive
                </button>
              </div>
              
              <hr className="border-border" />
              
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-red-600">Danger Zone</h4>
                <p className="text-sm text-slate-600">Permanently delete your account and all associated data. This action cannot be undone.</p>
                <button className="mt-2 w-full rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white shadow-sm shadow-red-600/20 transition-all hover:bg-red-700">
                  Delete Account
                </button>
              </div>
            </div>
          )}
          
          {action === "Language" && (
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Select your preferred language.</p>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-[#113680]">Language</label>
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-border bg-slate-50 px-4 py-2.5 text-sm transition-colors focus:border-[#113680]/50 focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#113680]/10"
                >
                  <option value="en-US">English (US)</option>
                  <option value="en-GB">English (UK)</option>
                  <option value="fr-FR">French</option>
                  <option value="es-ES">Spanish</option>
                  <option value="de-DE">German</option>
                </select>
              </div>
            </div>
          )}
          
        </div>
        
        {/* Footer */}
        {action !== "Active Sessions" && action !== "Data & Privacy" && (
          <div className="flex items-center justify-end gap-3 border-t border-border bg-slate-50 p-5">
            <button
              onClick={onClose}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleActionSubmit}
              disabled={isSaving || success}
              className="flex min-w-[120px] items-center justify-center gap-2 rounded-xl bg-[#113680] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all hover:bg-[#0a2050] disabled:opacity-80"
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
      </div>
    </div>
  );
}
