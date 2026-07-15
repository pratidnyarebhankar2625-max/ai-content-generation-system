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
import { createToken, verifyToken, isTokenExpired } from "@/lib/jwt";

// ─── Types ───────────────────────────────────────────────────────────────────

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  provider: "credentials" | "google";
  createdAt: string;
};

type StoredUser = AuthUser & {
  passwordHash: string; // simple hash for demo — NOT real cryptography
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
};

type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
  data?: Record<string, string>;
};

// ─── Storage Keys ────────────────────────────────────────────────────────────

const USERS_KEY = "ai-auth-users";
const SESSION_KEY = "ai-auth-session";
const REMEMBER_KEY = "ai-auth-remember";
const RESET_TOKENS_KEY = "ai-auth-reset-tokens";
const VERIFY_TOKENS_KEY = "ai-auth-verify-tokens";

// ─── Simple Password Hashing (demo only) ────────────────────────────────────
// In production, use bcrypt on the server. This is a deterministic hash
// for client-side demo purposes only.

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return "h_" + Math.abs(hash).toString(36) + "_" + str.length;
}

// ─── Storage Helpers ─────────────────────────────────────────────────────────

function getUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUsers(users: StoredUser[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function getSession(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(SESSION_KEY);
}

function saveSession(token: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSION_KEY, token);
}

function clearSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(REMEMBER_KEY);
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Restore session on mount ─────────────────────────────────────────────
  useEffect(() => {
    async function restoreSession() {
      const token = getSession();
      if (!token) {
        setIsLoading(false);
        return;
      }

      if (isTokenExpired(token)) {
        clearSession();
        setIsLoading(false);
        return;
      }

      const payload = await verifyToken(token);
      if (!payload) {
        clearSession();
        setIsLoading(false);
        return;
      }

      // Find user in storage
      const users = getUsers();
      const found = users.find((u) => u.id === payload.userId);
      if (found) {
        setUser(stripPassword(found));
      } else {
        clearSession();
      }

      setIsLoading(false);
    }

    restoreSession();
  }, []);

  // ── Session refresh on activity ──────────────────────────────────────────
  useEffect(() => {
    if (!user) return;

    const refreshInterval = setInterval(async () => {
      const token = getSession();
      if (!token || isTokenExpired(token)) {
        setUser(null);
        clearSession();
        return;
      }

      // Refresh if within 1 hour of expiry
      const payload = await verifyToken(token);
      if (payload && payload.expiresAt) {
        const timeLeft = payload.expiresAt - Date.now();
        if (timeLeft < 60 * 60 * 1000) {
          const remembered = localStorage.getItem(REMEMBER_KEY) === "true";
          const newToken = await createToken(
            { userId: payload.userId, email: payload.email, name: payload.name },
            remembered ? "30d" : "24h"
          );
          saveSession(newToken);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [user]);

  // ── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(
    async (name: string, email: string, password: string): Promise<AuthResult> => {
      const users = getUsers();

      if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
        return { success: false, error: "An account with this email already exists." };
      }

      const newUser: StoredUser = {
        id: generateId(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash: simpleHash(password),
        isVerified: false,
        provider: "credentials",
        createdAt: new Date().toISOString(),
      };

      users.push(newUser);
      saveUsers(users);

      // Create a verification token
      const verifyTokenStr = generateToken();
      const verifyTokens = JSON.parse(
        localStorage.getItem(VERIFY_TOKENS_KEY) || "{}"
      );
      verifyTokens[newUser.email] = {
        token: verifyTokenStr,
        createdAt: Date.now(),
      };
      localStorage.setItem(VERIFY_TOKENS_KEY, JSON.stringify(verifyTokens));

      // Create session
      const token = await createToken(
        { userId: newUser.id, email: newUser.email, name: newUser.name },
        "24h"
      );
      saveSession(token);
      setUser(stripPassword(newUser));

      return {
        success: true,
        message: "Account created! Please verify your email.",
        data: { verifyToken: verifyTokenStr },
      };
    },
    []
  );

  // ── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(
    async (
      email: string,
      password: string,
      rememberMe: boolean = false
    ): Promise<AuthResult> => {
      const users = getUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!found) {
        return { success: false, error: "No account found with this email." };
      }

      if (found.provider === "google") {
        return {
          success: false,
          error: "This account uses Google sign-in. Please use the Google button.",
        };
      }

      if (found.passwordHash !== simpleHash(password)) {
        return { success: false, error: "Invalid password. Please try again." };
      }

      const expiresIn = rememberMe ? "30d" : "24h";
      const token = await createToken(
        { userId: found.id, email: found.email, name: found.name },
        expiresIn
      );
      saveSession(token);

      if (rememberMe) {
        localStorage.setItem(REMEMBER_KEY, "true");
      }

      setUser(stripPassword(found));
      return { success: true, message: "Welcome back!" };
    },
    []
  );

  // ── Google Sign-In (Simulated) ───────────────────────────────────────────
  const googleSignIn = useCallback(async (): Promise<AuthResult> => {
    const users = getUsers();

    // Simulate a Google user
    const googleEmail = "user@gmail.com";
    const googleName = "Google User";

    let found = users.find((u) => u.email === googleEmail);

    if (!found) {
      const newUser: StoredUser = {
        id: generateId(),
        name: googleName,
        email: googleEmail,
        passwordHash: "",
        isVerified: true,
        provider: "google",
        createdAt: new Date().toISOString(),
      };
      users.push(newUser);
      saveUsers(users);
      found = newUser;
    }

    const token = await createToken(
      { userId: found.id, email: found.email, name: found.name },
      "30d"
    );
    saveSession(token);
    localStorage.setItem(REMEMBER_KEY, "true");
    setUser(stripPassword(found));

    return { success: true, message: "Signed in with Google!" };
  }, []);

  // ── Forgot Password ──────────────────────────────────────────────────────
  const forgotPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const users = getUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase().trim()
      );

      if (!found) {
        // Don't reveal if email exists (security best practice)
        return {
          success: true,
          message:
            "If an account with that email exists, a reset link has been sent.",
        };
      }

      if (found.provider === "google") {
        return {
          success: false,
          error: "This account uses Google sign-in. Password reset is not available.",
        };
      }

      const resetToken = generateToken();
      const resetTokens = JSON.parse(
        localStorage.getItem(RESET_TOKENS_KEY) || "{}"
      );
      resetTokens[found.email] = {
        token: resetToken,
        createdAt: Date.now(),
      };
      localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(resetTokens));

      return {
        success: true,
        message: "If an account with that email exists, a reset link has been sent.",
        data: { resetToken, email: found.email },
      };
    },
    []
  );

  // ── Reset Password ───────────────────────────────────────────────────────
  const resetPassword = useCallback(
    async (token: string, newPassword: string): Promise<AuthResult> => {
      const resetTokens = JSON.parse(
        localStorage.getItem(RESET_TOKENS_KEY) || "{}"
      );

      // Find email for this token
      let targetEmail: string | null = null;
      for (const [email, data] of Object.entries(resetTokens)) {
        const tokenData = data as { token: string; createdAt: number };
        if (tokenData.token === token) {
          // Check if token is less than 1 hour old
          if (Date.now() - tokenData.createdAt > 60 * 60 * 1000) {
            return { success: false, error: "Reset link has expired. Please request a new one." };
          }
          targetEmail = email;
          break;
        }
      }

      if (!targetEmail) {
        return { success: false, error: "Invalid or expired reset link." };
      }

      const users = getUsers();
      const userIndex = users.findIndex((u) => u.email === targetEmail);
      if (userIndex === -1) {
        return { success: false, error: "User not found." };
      }

      users[userIndex].passwordHash = simpleHash(newPassword);
      saveUsers(users);

      // Remove used token
      delete resetTokens[targetEmail];
      localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(resetTokens));

      return {
        success: true,
        message: "Password reset successfully! You can now log in.",
      };
    },
    []
  );

  // ── Verify Email ─────────────────────────────────────────────────────────
  const verifyEmail = useCallback(
    async (token: string): Promise<AuthResult> => {
      const verifyTokens = JSON.parse(
        localStorage.getItem(VERIFY_TOKENS_KEY) || "{}"
      );

      let targetEmail: string | null = null;
      for (const [email, data] of Object.entries(verifyTokens)) {
        if ((data as { token: string }).token === token) {
          targetEmail = email;
          break;
        }
      }

      if (!targetEmail) {
        return { success: false, error: "Invalid verification link." };
      }

      const users = getUsers();
      const userIndex = users.findIndex((u) => u.email === targetEmail);
      if (userIndex === -1) {
        return { success: false, error: "User not found." };
      }

      users[userIndex].isVerified = true;
      saveUsers(users);

      // Update current user state
      if (user && user.email === targetEmail) {
        setUser({ ...user, isVerified: true });
      }

      // Remove used token
      delete verifyTokens[targetEmail];
      localStorage.setItem(VERIFY_TOKENS_KEY, JSON.stringify(verifyTokens));

      return { success: true, message: "Email verified successfully!" };
    },
    [user]
  );

  // ── Resend Verification ──────────────────────────────────────────────────
  const resendVerification = useCallback(async (): Promise<AuthResult> => {
    if (!user) {
      return { success: false, error: "Not logged in." };
    }

    const verifyTokenStr = generateToken();
    const verifyTokens = JSON.parse(
      localStorage.getItem(VERIFY_TOKENS_KEY) || "{}"
    );
    verifyTokens[user.email] = {
      token: verifyTokenStr,
      createdAt: Date.now(),
    };
    localStorage.setItem(VERIFY_TOKENS_KEY, JSON.stringify(verifyTokens));

    return {
      success: true,
      message: "Verification email resent!",
      data: { verifyToken: verifyTokenStr },
    };
  }, [user]);

  // ── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(() => {
    setUser(null);
    clearSession();
  }, []);

  // ── Context Value ────────────────────────────────────────────────────────
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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stripPassword(user: StoredUser): AuthUser {
  const { passwordHash: _, ...rest } = user;
  return rest;
}
