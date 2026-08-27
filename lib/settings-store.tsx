"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth-store";
import { useTheme } from "next-themes";

// ─── Types ───────────────────────────────────────────────────────────────────

export type UserSettings = {
  theme: string;
  language: string;
  writing_tone: string;
  default_ai_model: string;
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
  const { setTheme } = useTheme();

  const userId = user?.id;
  const isMutationInFlight = useRef(0);
  const mutationVersionRef = useRef(0);
  const requestVersionRef = useRef(0);
  const settingsRef = useRef<UserSettings | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      const saved = typeof window !== 'undefined' ? localStorage.getItem("user_settings_fallback") : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          settingsRef.current = parsed;
          setSettings(parsed);
        } catch {}
      } else {
        settingsRef.current = null;
        setSettings(null);
      }
      setIsLoading(false);
      return;
    }

    const currentRequestVersion = ++requestVersionRef.current;
    setIsLoading(true);

    try {
      const res = await fetch('/api/settings', { cache: 'no-store' });
      const json = await res.json();

      // If a newer GET was started or a mutation is currently in flight, ignore this GET response
      if (currentRequestVersion !== requestVersionRef.current || isMutationInFlight.current > 0) {
        return;
      }

      if (res.ok && json.success && json.data) {
        const mappedSettings: UserSettings = {
          theme: json.data.theme || DEFAULT_SETTINGS.theme,
          language: json.data.language || DEFAULT_SETTINGS.language,
          writing_tone: json.data.writing_tone || DEFAULT_SETTINGS.writing_tone,
          default_ai_model: json.data.default_ai_model || DEFAULT_SETTINGS.default_ai_model,
          email_notifications: typeof json.data.email_notifications === "boolean" ? json.data.email_notifications : DEFAULT_SETTINGS.email_notifications,
          push_notifications: typeof json.data.push_notifications === "boolean" ? json.data.push_notifications : DEFAULT_SETTINGS.push_notifications,
          generation_alerts: typeof json.data.generation_alerts === "boolean" ? json.data.generation_alerts : DEFAULT_SETTINGS.generation_alerts,
        };
        settingsRef.current = mappedSettings;
        setSettings(mappedSettings);
        if (typeof window !== 'undefined') {
          localStorage.setItem("user_settings_fallback", JSON.stringify(mappedSettings));
        }
      } else {
        const saved = typeof window !== 'undefined' ? localStorage.getItem("user_settings_fallback") : null;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            settingsRef.current = parsed;
            setSettings(parsed);
          } catch {
            settingsRef.current = DEFAULT_SETTINGS;
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          settingsRef.current = DEFAULT_SETTINGS;
          setSettings(DEFAULT_SETTINGS);
        }
      }
    } catch (err) {
      console.warn("Failed to fetch settings from API:", err);
      if (currentRequestVersion !== requestVersionRef.current || isMutationInFlight.current > 0) {
        return;
      }
      const saved = typeof window !== 'undefined' ? localStorage.getItem("user_settings_fallback") : null;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          settingsRef.current = parsed;
          setSettings(parsed);
        } catch {
          settingsRef.current = DEFAULT_SETTINGS;
          setSettings(DEFAULT_SETTINGS);
        }
      } else {
        settingsRef.current = DEFAULT_SETTINGS;
        setSettings(DEFAULT_SETTINGS);
      }
    } finally {
      if (currentRequestVersion === requestVersionRef.current) {
        setIsLoading(false);
      }
    }
  }, [userId, isAuthenticated]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply theme when settings load/change
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!userId) return { success: false, error: "Not authenticated" };

      const currentMutationVersion = ++mutationVersionRef.current;
      const prevSettings = settingsRef.current ?? DEFAULT_SETTINGS;

      // Optimistic functional update
      const nextSettings: UserSettings = {
        ...prevSettings,
        ...newSettings,
      };

      settingsRef.current = nextSettings;
      setSettings(nextSettings);
      if (typeof window !== 'undefined') {
        localStorage.setItem("user_settings_fallback", JSON.stringify(nextSettings));
      }

      isMutationInFlight.current += 1;

      try {
        const res = await fetch('/api/settings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newSettings),
        });

        const json = await res.json();

        if (!res.ok || !json.success) {
          const errorMessage = json.error?.message || "Failed to update settings";
          // Only revert if no newer mutation has taken over
          if (currentMutationVersion === mutationVersionRef.current) {
            settingsRef.current = prevSettings;
            setSettings(prevSettings);
            if (typeof window !== 'undefined') {
              localStorage.setItem("user_settings_fallback", JSON.stringify(prevSettings));
            }
          }
          return { success: false, error: errorMessage };
        }

        // Only update with server response if this is still the latest mutation
        if (currentMutationVersion === mutationVersionRef.current) {
          const serverSettings: UserSettings = {
            theme: json.data.theme || nextSettings.theme,
            language: json.data.language || nextSettings.language,
            writing_tone: json.data.writing_tone || nextSettings.writing_tone,
            default_ai_model: json.data.default_ai_model || nextSettings.default_ai_model,
            email_notifications: typeof json.data.email_notifications === "boolean" ? json.data.email_notifications : nextSettings.email_notifications,
            push_notifications: typeof json.data.push_notifications === "boolean" ? json.data.push_notifications : nextSettings.push_notifications,
            generation_alerts: typeof json.data.generation_alerts === "boolean" ? json.data.generation_alerts : nextSettings.generation_alerts,
          };

          settingsRef.current = serverSettings;
          setSettings(serverSettings);
          if (typeof window !== 'undefined') {
            localStorage.setItem("user_settings_fallback", JSON.stringify(serverSettings));
          }
        }

        return { success: true };
      } catch (err: any) {
        // Only revert if no newer mutation has taken over
        if (currentMutationVersion === mutationVersionRef.current) {
          settingsRef.current = prevSettings;
          setSettings(prevSettings);
          if (typeof window !== 'undefined') {
            localStorage.setItem("user_settings_fallback", JSON.stringify(prevSettings));
          }
        }
        return { success: false, error: err?.message || "Network error" };
      } finally {
        isMutationInFlight.current = Math.max(0, isMutationInFlight.current - 1);
      }
    },
    [userId]
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
