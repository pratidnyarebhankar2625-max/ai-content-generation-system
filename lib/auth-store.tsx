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
  data?: Record<string, string>;
};

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

async function mapSupabaseUser(supabase: any, user: User): Promise<AuthUser> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    name: profile?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
    email: user.email || "",
    isVerified: !!user.email_confirmed_at,
    provider: user.app_metadata?.provider === "google" ? "google" : "credentials",
    createdAt: profile?.joined_date || user.created_at,
    avatar: profile?.avatar || user.user_metadata?.avatar_url,
    bio: profile?.bio,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Initial fetch
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (user) {
        const mappedUser = await mapSupabaseUser(supabase, user);
        setUser(mappedUser);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          const mappedUser = await mapSupabaseUser(supabase, session.user);
          setUser(mappedUser);
        } else {
          setUser(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.session) {
        return {
          success: true,
          message: "Account created successfully!",
          data: { requireVerification: false }
        };
      }

      return {
        success: true,
        message: "Account created! Please check your email to verify.",
        data: { requireVerification: true }
      };
    },
    [supabase.auth]
  );

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (email: string, password: string, rememberMe?: boolean): Promise<AuthResult> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, message: "Welcome back!" };
    },
    [supabase.auth]
  );

  // ── Google Sign-In ───────────────────────────────────────────────────────
  const googleSignIn = useCallback(async (): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
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
    await supabase.auth.signOut();
  }, [supabase.auth]);

  // ── Update User ──────────────────────────────────────────────────────────
  const updateUser = useCallback(
    async (data: Partial<AuthUser>): Promise<AuthResult> => {
      if (!user) return { success: false, error: "Not logged in." };

      // Update auth metadata
      const authUpdate: any = {};
      if (data.name !== undefined) authUpdate.full_name = data.name;
      
      const { error: authError } = await supabase.auth.updateUser({
        data: authUpdate,
      });

      if (authError) {
        return { success: false, error: authError.message };
      }

      // Update profiles table
      const profileUpdate: any = {};
      if (data.name !== undefined) profileUpdate.name = data.name;
      if (data.bio !== undefined) profileUpdate.bio = data.bio;
      if (data.avatar !== undefined) profileUpdate.avatar = data.avatar;

      if (Object.keys(profileUpdate).length > 0) {
        const { error: profileError } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", user.id);

        if (profileError) {
          return { success: false, error: profileError.message };
        }
      }

      // Refresh user to get latest profile state
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        const mappedUser = await mapSupabaseUser(supabase, userData.user);
        setUser(mappedUser);
      }

      return { success: true, message: "Profile updated successfully!" };
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
