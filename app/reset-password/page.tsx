"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import {
  validatePassword,
  validateConfirmPassword,
  getPasswordRequirements,
  getPasswordStrength,
} from "@/lib/auth-validators";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  Check,
  X,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";

function ResetPasswordForm() {
  const { resetPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const requirements = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("Invalid reset link. Please request a new one.");
      return;
    }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) { setError(passCheck.error); return; }

    const confirmCheck = validateConfirmPassword(password, confirmPassword);
    if (!confirmCheck.valid) { setError(confirmCheck.error); return; }

    setIsSubmitting(true);
    const result = await resetPassword(token, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(true);
    } else {
      setError(result.error || "Reset failed.");
    }
  }

  if (success) {
    return (
      <AuthLayout title="Password reset!" subtitle="Your password has been changed successfully.">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 animate-scale-in">
              <ShieldCheck className="h-9 w-9 text-emerald-600" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            You can now sign in with your new password.
          </p>

          <Link
            href="/login"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01]"
          >
            Go to Sign In
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="This reset link is invalid or has expired.">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 animate-scale-in">
              <AlertCircle className="h-9 w-9 text-red-400" />
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Please request a new password reset link.
          </p>

          <Link
            href="/forgot-password"
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01]"
          >
            Request New Link
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset your password" subtitle="Choose a new, strong password for your account.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="reset-password" className="text-sm font-medium text-foreground">
            New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="reset-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-12 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {/* Password Strength */}
          {password && (
            <div className="space-y-2.5 animate-fade-in">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: i < strength.score ? strength.color : "#C8D9E6",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}

          {/* Requirements */}
          {password && (
            <div className="space-y-1.5 animate-fade-in">
              {requirements.map((req) => (
                <div
                  key={req.label}
                  className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                    req.met ? "text-emerald-600" : "text-muted-foreground/60"
                  }`}
                >
                  {req.met ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="reset-confirm" className="text-sm font-medium text-foreground">
            Confirm New Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="reset-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
            {confirmPassword && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {password === confirmPassword ? (
                  <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                ) : (
                  <AlertCircle className="h-[18px] w-[18px] text-red-400" />
                )}
              </div>
            )}
          </div>
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
              Resetting...
            </span>
          ) : (
            "Reset Password"
          )}
        </button>

        <Link
          href="/login"
          className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </form>
    </AuthLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <AuthLayout title="Loading..." subtitle="Please wait.">
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
          </div>
        </AuthLayout>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
