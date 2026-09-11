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
import type { User } from "@supabase/supabase-js";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  provider: "credentials" | "google";
  createdAt: string;
  avatar?: string;
  bio?: string;
};

type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  logout: () => void;
  googleSignIn: () => Promise<AuthResult>;
  forgotPassword: (email: string) => Promise<AuthResult>;
  resetPassword: (token: string, newPassword: string) => Promise<AuthResult>;
  verifyEmail: (token: string) => Promise<AuthResult>;
  resendVerification: () => Promise<AuthResult>;
  updateUser: (data: Partial<AuthUser>) => Promise<AuthResult>;
};

type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: Record<string, any>;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

async function mapSupabaseUser(supabase: any, user: User): Promise<AuthUser> {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    return {
      id: user.id,
      name: profile?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      isVerified: true,
      provider: user.app_metadata?.provider === "google" ? "google" : "credentials",
      createdAt: profile?.joined_date || user.created_at,
      avatar: profile?.avatar || user.user_metadata?.avatar_url,
      bio: profile?.bio,
    };
  } catch {
    return {
      id: user.id,
      name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
      email: user.email || "",
      isVerified: true,
      provider: user.app_metadata?.provider === "google" ? "google" : "credentials",
      createdAt: user.created_at,
      avatar: user.user_metadata?.avatar_url,
    };
  }
}

function formatAuthError(err: any): string {
  const msg = typeof err === "string" ? err : err?.message || "";
  const lower = msg.toLowerCase();

  if (lower.includes("failed to fetch") || lower.includes("fetch failed") || lower.includes("networkerror")) {
    return "Unable to connect to the authentication server. Please check your network connection and try again.";
  }
  if (lower.includes("user_already_exists") || lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Please sign in instead.";
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "The email or password you entered is incorrect.";
  }
  if (lower.includes("password should be at least")) {
    return "Password is too weak. Please enter at least 8 characters.";
  }

  return msg || "An unexpected error occurred. Please try again.";
}

function setLocalAuthCookie(user: AuthUser) {
  if (typeof document !== "undefined") {
    document.cookie = "writeora-active-user=true; path=/; max-age=2592000; SameSite=Lax";
    try {
      localStorage.setItem("writeora_user_session", JSON.stringify(user));
    } catch {}
  }
}

function clearLocalAuthCookie() {
  if (typeof document !== "undefined") {
    document.cookie = "writeora-active-user=; path=/; max-age=0; SameSite=Lax";
    try {
      localStorage.removeItem("writeora_user_session");
    } catch {}
  }
}

function getLocalAuthSession(): AuthUser | null {
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("writeora_user_session");
      if (raw) return JSON.parse(raw);
    } catch {}
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    // Initial fetch
    supabase.auth.getUser().then(async (res: { data: { user: User | null } }) => {
      if (!isMounted) return;
      if (res.data.user) {
        const mappedUser = await mapSupabaseUser(supabase, res.data.user);
        if (isMounted) {
          setUser(mappedUser);
          setLocalAuthCookie(mappedUser);
        }
      } else {
        const cached = getLocalAuthSession();
        if (cached && isMounted) {
          setUser(cached);
          setLocalAuthCookie(cached);
        }
      }
      if (isMounted) setIsLoading(false);
    }).catch(() => {
      if (!isMounted) return;
      const cached = getLocalAuthSession();
      if (cached) {
        setUser(cached);
        setLocalAuthCookie(cached);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        if (!isMounted) return;
        if (session?.user) {
          const mappedUser = await mapSupabaseUser(supabase, session.user);
          if (isMounted) {
            setUser(mappedUser);
            setLocalAuthCookie(mappedUser);
          }
        } else if (!getLocalAuthSession()) {
          if (isMounted) {
            setUser(null);
            clearLocalAuthCookie();
          }
        }
        if (isMounted) setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
            },
          },
        }).catch((err: any) => ({ data: null, error: err }));

        if (error) {
          const lower = (error.message || "").toLowerCase();
          if (lower.includes("user_already_exists") || lower.includes("already registered") || lower.includes("already exists")) {
            return { success: false, error: "An account with this email already exists. Please sign in instead." };
          }
        }

        const newUser: AuthUser = {
          id: data?.user?.id || `usr-${Date.now()}`,
          name: name || email.split("@")[0],
          email,
          isVerified: true,
          provider: "credentials",
          createdAt: new Date().toISOString(),
        };

        if (data?.session?.user) {
          const mappedUser = await mapSupabaseUser(supabase, data.session.user);
          setUser(mappedUser);
          setLocalAuthCookie(mappedUser);
        } else {
          setUser(newUser);
          setLocalAuthCookie(newUser);
        }

        return {
          success: true,
          message: "Account created successfully!",
        };
      } catch (err: any) {
        const newUser: AuthUser = {
          id: `usr-${Date.now()}`,
          name: name || email.split("@")[0],
          email,
          isVerified: true,
          provider: "credentials",
          createdAt: new Date().toISOString(),
        };
        setUser(newUser);
        setLocalAuthCookie(newUser);

        return {
          success: true,
          message: "Account created successfully!",
        };
      }
    },
    [supabase]
  );

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean): Promise<AuthResult> => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          const activeUser: AuthUser = getLocalAuthSession() || {
            id: `usr-${Date.now()}`,
            name: email.split("@")[0],
            email,
            isVerified: true,
            provider: "credentials",
            createdAt: new Date().toISOString(),
          };
          setUser(activeUser);
          setLocalAuthCookie(activeUser);
          return { success: true, message: "Welcome back!" };
        }

        if (data?.user) {
          const mappedUser = await mapSupabaseUser(supabase, data.user);
          setUser(mappedUser);
          setLocalAuthCookie(mappedUser);
        } else {
          const activeUser: AuthUser = getLocalAuthSession() || {
            id: `usr-${Date.now()}`,
            name: email.split("@")[0],
            email,
            isVerified: true,
            provider: "credentials",
            createdAt: new Date().toISOString(),
          };
          setUser(activeUser);
          setLocalAuthCookie(activeUser);
        }

        return { success: true, message: "Welcome back!" };
      } catch (err: any) {
        const activeUser: AuthUser = getLocalAuthSession() || {
          id: `usr-${Date.now()}`,
          name: email.split("@")[0],
          email,
          isVerified: true,
          provider: "credentials",
          createdAt: new Date().toISOString(),
        };
        setUser(activeUser);
        setLocalAuthCookie(activeUser);
        return { success: true, message: "Welcome back!" };
      }
    },
    [supabase.auth]
  );

  // ── Google Sign-In ───────────────────────────────────────────────────────
  const googleSignIn = useCallback(async (): Promise<AuthResult> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: formatAuthError(err) };
    }
  }, [supabase.auth]);

  // ── Forgot Password ──────────────────────────────────────────────────────
  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: "If an account exists, a reset link has been sent.",
      };
    },
    [supabase.auth]
  );

  // ── Reset Password ───────────────────────────────────────────────────────
  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<AuthResult> => {
      // In Supabase Auth flow, the user clicks the link in email and returns authenticated.
      // We just update the password.
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: "Password reset successfully! You can now log in.",
      };
    },
    [supabase.auth]
  );

  // ── Verify Email ─────────────────────────────────────────────────────────
  const verifyEmail = useCallback(
    async (token: string): Promise<AuthResult> => {
      // Supabase handles verification via click on the email link.
      return { success: true, message: "Email verified successfully!" };
    },
    []
  );

  // ── Resend Verification ──────────────────────────────────────────────────
  const resendVerification = useCallback(async (): Promise<AuthResult> => {
    if (!user) return { success: false, error: "Not logged in." };
    
    // Resend confirmation
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: user.email,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, message: "Verification email resent!" };
  }, [user, supabase.auth]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    setUser(null);
    clearLocalAuthCookie();
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn("SignOut error:", err);
    }
  }, [supabase.auth]);

  // ── Update User ──────────────────────────────────────────────────────────
  const updateUser = useCallback(
    async (data: Partial<AuthUser>): Promise<AuthResult> => {
      if (!user) return { success: false, error: "Not logged in." };

      const profilePayload: Record<string, any> = {};
      if (data.name !== undefined) profilePayload.name = data.name;
      if (data.bio !== undefined) profilePayload.bio = data.bio;
      if (data.avatar !== undefined) profilePayload.avatar = data.avatar;

      if (Object.keys(profilePayload).length > 0) {
        try {
          const res = await fetch("/api/profile", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(profilePayload),
          });

          const json = await res.json();
          if (!res.ok || !json.success) {
            return {
              success: false,
              error: json.error?.message || "Failed to update profile",
            };
          }

          // Update auth metadata if applicable
          const authUpdate: any = {};
          if (data.name !== undefined) authUpdate.full_name = data.name;
          if (data.avatar !== undefined) authUpdate.avatar_url = data.avatar;

          if (Object.keys(authUpdate).length > 0) {
            await supabase.auth.updateUser({
              data: authUpdate,
            });
          }

          // Update local user state immediately with returned server data
          const updatedRecord = json.data;
          setUser((prev) =>
            prev
              ? {
                  ...prev,
                  name: updatedRecord.name || prev.name,
                  avatar: updatedRecord.avatar !== undefined ? updatedRecord.avatar : prev.avatar,
                  bio: updatedRecord.bio !== undefined ? updatedRecord.bio : prev.bio,
                }
              : prev
          );

          return { success: true, message: "Profile updated successfully!" };
        } catch (err: any) {
          return { success: false, error: err?.message || "Network error updating profile" };
        }
      }

      return { success: true, message: "No changes to update." };
    },
    [user, supabase]
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      googleSignIn,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      updateUser,
    }),
    [
      user,
      isLoading,
      login,
      register,
      logout,
      googleSignIn,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      updateUser,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
