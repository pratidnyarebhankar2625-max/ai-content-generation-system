"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth-store";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserSettings = {
  theme: string;
  language: string;
  writing_tone: string;
  default_ai_model: string;
  byok_api_key: string | null;
  email_notifications: boolean;
  push_notifications: boolean;
  generation_alerts: boolean;
};

type SettingsContextType = {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
};

// Default settings as fallback
const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  language: "en-US",
  writing_tone: "professional",
  default_ai_model: "gemini-2.5-pro",
  byok_api_key: null,
  email_notifications: true,
  push_notifications: false,
  generation_alerts: true,
};

// ─── Context ─────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    async function fetchSettings() {
      if (!isAuthenticated || !user) {
        setSettings(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const { data, error } = await supabase
        .from("user_settings")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        // Fallback to default if not found or table doesn't exist yet
        if (error.code === 'PGRST116' || error.code === '42P01') {
           setSettings(DEFAULT_SETTINGS);
           if (error.code === '42P01') {
             console.warn("user_settings table does not exist. Please run the SQL migration script.");
           }
        } else {
           console.warn("Warning fetching settings:", error);
           setSettings(DEFAULT_SETTINGS);
        }
      } else if (data) {
        setSettings({
          theme: data.theme,
          language: data.language,
          writing_tone: data.writing_tone,
          default_ai_model: data.default_ai_model,
          byok_api_key: data.byok_api_key,
          email_notifications: data.email_notifications,
          push_notifications: data.push_notifications,
          generation_alerts: data.generation_alerts,
        });
      }
      setIsLoading(false);
    }

    fetchSettings();
  }, [user, isAuthenticated, supabase]);

  // Apply theme when settings load/change
  useEffect(() => {
    if (settings?.theme) {
      if (settings.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [settings?.theme]);

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!user) return { success: false, error: "Not authenticated" };

      // Optimistic update
      setSettings((prev) => (prev ? { ...prev, ...newSettings } : ({ ...DEFAULT_SETTINGS, ...newSettings } as UserSettings)));

      const { error } = await supabase
        .from("user_settings")
        .update(newSettings)
        .eq("id", user.id);

      if (error) {
        console.warn("Error updating settings:", error);
        // Re-fetch on error to revert optimistic update
        const { data } = await supabase
          .from("user_settings")
          .select("*")
          .eq("id", user.id)
          .single();
        if (data) setSettings(data as UserSettings);
        
        return { success: false, error: error.message };
      }

      return { success: true };
    },
    [user, supabase]
  );

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      isLoading,
      updateSettings,
    }),
    [settings, isLoading, updateSettings]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
