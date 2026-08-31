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
  updateSettings: (
    newSettings: Partial<UserSettings>
  ) => Promise<{ success: boolean; error?: string }>;
};

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS: UserSettings = {
  theme: "light",
  language: "en-US",
  writing_tone: "professional",
  default_ai_model: "gemini-2.5-pro",
  email_notifications: true,
  push_notifications: false,
  generation_alerts: true,
};

const STORAGE_KEY = "user_settings_fallback";

// ─── Context ─────────────────────────────────────────────────────────────────

const SettingsContext = createContext<SettingsContextType | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SettingsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isAuthenticated } = useAuth();
  const { setTheme } = useTheme();

  const userId = user?.id;

  // Always keep the latest settings available to async functions.
  const settingsRef = useRef<UserSettings | null>(null);

  // Number of active PATCH requests.
  const mutationCountRef = useRef(0);

  // Used to invalidate stale GET requests.
  const requestVersionRef = useRef(0);

  // Used to ensure an older PATCH cannot overwrite a newer PATCH.
  const latestMutationRef = useRef(0);

  // ─── Keep ref synchronized ───────────────────────────────────────────────

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  // ─── Local Storage ────────────────────────────────────────────────────────

  const readLocalSettings = useCallback((): UserSettings | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (!stored) {
        return null;
      }

      return JSON.parse(stored) as UserSettings;
    } catch {
      return null;
    }
  }, []);

  const writeLocalSettings = useCallback(
    (value: UserSettings) => {
      if (typeof window === "undefined") {
        return;
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // Ignore localStorage errors.
      }
    },
    []
  );

  // ─── Fetch Settings ───────────────────────────────────────────────────────

  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated || !userId) {
      const localSettings = readLocalSettings();

      if (localSettings) {
        settingsRef.current = localSettings;
        setSettings(localSettings);
      } else {
        settingsRef.current = null;
        setSettings(null);
      }

      setIsLoading(false);
      return;
    }

    // Every GET receives a version.
    const requestVersion = ++requestVersionRef.current;

    setIsLoading(true);

    try {
      const response = await fetch("/api/settings", {
        method: "GET",
        cache: "no-store",
      });

      const result = await response.json();

      /**
       * Ignore this GET if:
       *
       * 1. A newer GET started, or
       * 2. A PATCH happened while this GET was running.
       */
      if (
        requestVersion !== requestVersionRef.current ||
        mutationCountRef.current > 0
      ) {
        return;
      }

      if (
        response.ok &&
        result?.success &&
        result?.data
      ) {
        const data = result.data;

        const serverSettings: UserSettings = {
          theme:
            data.theme ??
            DEFAULT_SETTINGS.theme,

          language:
            data.language ??
            DEFAULT_SETTINGS.language,

          writing_tone:
            data.writing_tone ??
            DEFAULT_SETTINGS.writing_tone,

          default_ai_model:
            data.default_ai_model ??
            DEFAULT_SETTINGS.default_ai_model,

          email_notifications:
            data.email_notifications ??
            DEFAULT_SETTINGS.email_notifications,

          push_notifications:
            data.push_notifications ??
            DEFAULT_SETTINGS.push_notifications,

          generation_alerts:
            data.generation_alerts ??
            DEFAULT_SETTINGS.generation_alerts,
        };

        settingsRef.current = serverSettings;
        setSettings(serverSettings);
        writeLocalSettings(serverSettings);
      } else {
        const localSettings = readLocalSettings();

        if (localSettings) {
          settingsRef.current = localSettings;
          setSettings(localSettings);
        } else {
          settingsRef.current = DEFAULT_SETTINGS;
          setSettings(DEFAULT_SETTINGS);
        }
      }
    } catch (error) {
      console.warn(
        "Failed to fetch settings:",
        error
      );

      /**
       * Do not replace current state with localStorage
       * if a mutation has happened.
       */
      if (
        requestVersion !== requestVersionRef.current ||
        mutationCountRef.current > 0
      ) {
        return;
      }

      const localSettings = readLocalSettings();

      if (localSettings) {
        settingsRef.current = localSettings;
        setSettings(localSettings);
      } else {
        settingsRef.current = DEFAULT_SETTINGS;
        setSettings(DEFAULT_SETTINGS);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    isAuthenticated,
    userId,
    readLocalSettings,
    writeLocalSettings,
  ]);

  // Fetch whenever authentication/user changes.
  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // ─── Theme ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
    }
  }, [settings?.theme, setTheme]);

  // ─── Update Settings ──────────────────────────────────────────────────────

  const updateSettings = useCallback(
    async (newSettings: Partial<UserSettings>) => {
      if (!userId) {
        return {
          success: false,
          error: "Not authenticated",
        };
      }

      /**
       * Invalidate all GET requests currently running.
       */
      requestVersionRef.current += 1;

      /**
       * This mutation becomes the newest mutation.
       */
      const mutationId =
        ++latestMutationRef.current;

      const previousSettings =
        settingsRef.current ?? DEFAULT_SETTINGS;

      /**
       * Create the complete next state locally.
       */
      const optimisticSettings: UserSettings = {
        ...previousSettings,
        ...newSettings,
      };

      /**
       * Update React state IMMEDIATELY.
       */
      settingsRef.current = optimisticSettings;
      setSettings(optimisticSettings);

      /**
       * Persist optimistic state locally as a fallback.
       */
      writeLocalSettings(optimisticSettings);

      mutationCountRef.current += 1;

      try {
        const response = await fetch("/api/settings", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newSettings),
        });

        const result = await response.json();

        // ─── PATCH Failed ────────────────────────────────────────────────

        if (!response.ok || !result?.success) {
          const errorMessage =
            result?.error?.message ||
            result?.error ||
            "Failed to update settings";

          /**
           * Only rollback if this is still the newest mutation.
           */
          if (
            mutationId === latestMutationRef.current
          ) {
            settingsRef.current = previousSettings;
            setSettings(previousSettings);
            writeLocalSettings(previousSettings);
          }

          return {
            success: false,
            error: errorMessage,
          };
        }

        // ─── Ignore stale PATCH responses ───────────────────────────────

        if (
          mutationId !== latestMutationRef.current
        ) {
          return {
            success: true,
          };
        }

        /**
         * IMPORTANT:
         *
         * Start from the optimistic state and only replace
         * values that the API actually returned.
         *
         * This prevents false/undefined values from being
         * accidentally replaced by defaults.
         */
        const data = result?.data ?? {};

        const confirmedSettings: UserSettings = {
          ...optimisticSettings,

          ...(typeof data.theme === "string"
            ? { theme: data.theme }
            : {}),

          ...(typeof data.language === "string"
            ? { language: data.language }
            : {}),

          ...(typeof data.writing_tone === "string"
            ? {
              writing_tone:
                data.writing_tone,
            }
            : {}),

          ...(typeof data.default_ai_model ===
            "string"
            ? {
              default_ai_model:
                data.default_ai_model,
            }
            : {}),

          ...(typeof data.email_notifications ===
            "boolean"
            ? {
              email_notifications:
                data.email_notifications,
            }
            : {}),

          ...(typeof data.push_notifications ===
            "boolean"
            ? {
              push_notifications:
                data.push_notifications,
            }
            : {}),

          ...(typeof data.generation_alerts ===
            "boolean"
            ? {
              generation_alerts:
                data.generation_alerts,
            }
            : {}),
        };

        /**
         * Server-confirmed state.
         */
        settingsRef.current = confirmedSettings;
        setSettings(confirmedSettings);
        writeLocalSettings(confirmedSettings);

        return {
          success: true,
        };
      } catch (error) {
        console.error(
          "Failed to update settings:",
          error
        );

        /**
         * Only rollback if this is still the newest mutation.
         */
        if (
          mutationId === latestMutationRef.current
        ) {
          settingsRef.current = previousSettings;
          setSettings(previousSettings);
          writeLocalSettings(previousSettings);
        }

        return {
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Network error",
        };
      } finally {
        mutationCountRef.current = Math.max(
          0,
          mutationCountRef.current - 1
        );
      }
    },
    [userId, writeLocalSettings]
  );

  // ─── Context Value ────────────────────────────────────────────────────────

  const value = useMemo<SettingsContextType>(
    () => ({
      settings,
      isLoading,
      updateSettings,
    }),
    [
      settings,
      isLoading,
      updateSettings,
    ]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);

  if (!context) {
    throw new Error(
      "useSettings must be used within a SettingsProvider"
    );
  }

  return context;
}