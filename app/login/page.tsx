"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { validateEmail } from "@/lib/auth-validators";
import AuthLayout from "@/components/auth/AuthLayout";
import { Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  const { login, googleSignIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setIsSubmitting(true);
    const result = await login(email, password, rememberMe);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(result.message || "Login successful!");
      setTimeout(() => router.push("/"), 500);
    } else {
      setError(result.error || "Login failed.");
    }
  }

  async function handleGoogleSignIn() {
    setError("");
    setIsGoogleLoading(true);
    const result = await googleSignIn();
    setIsGoogleLoading(false);

    if (result.success) {
      setSuccess(result.message || "Signed in!");
      setTimeout(() => router.push("/"), 500);
    } else {
      setError(result.error || "Google sign-in failed.");
    }
  }

  return (
    <AuthLayout title="Welcome back" subtitle="Sign in to your account to continue.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Error / Success Messages */}
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 animate-fade-in-down">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            {success}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="login-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="login-password" className="text-sm font-medium text-foreground">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary-foreground transition-colors hover:text-primary-foreground"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-12 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-[18px] w-[18px]" />
              ) : (
                <Eye className="h-[18px] w-[18px]" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRememberMe(!rememberMe)}
            className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all duration-300 ${
              rememberMe
                ? "border-[#567C8D] bg-[#567C8D]"
                : "border-border hover:border-transparent"
            }`}
          >
            {rememberMe && (
              <svg className="h-3 w-3 text-[#2F4156]" viewBox="0 0 12 12" fill="none">
                <path
                  d="M2 6L5 9L10 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </button>
          <label
            onClick={() => setRememberMe(!rememberMe)}
            className="cursor-pointer text-sm text-muted-foreground"
          >
            Remember me for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="relative h-12 w-full rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing in...
            </span>
          ) : (
            "Sign In"
          )}
        </button>

        {/* Divider */}
        <div className="relative flex items-center py-1">
          <div className="flex-1 border-t border-border" />
          <span className="px-4 text-xs text-muted-foreground">or continue with</span>
          <div className="flex-1 border-t border-border" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isGoogleLoading}
          className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card text-sm font-medium text-foreground shadow-sm transition-all duration-300 hover:bg-muted hover:shadow-md hover:scale-[1.01] disabled:opacity-60"
        >
          {isGoogleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Continue with Google
        </button>

        {/* Register link */}
        <p className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary-foreground transition-colors hover:text-primary-foreground"
          >
            Create one
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}