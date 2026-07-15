"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import {
  validateEmail,
  validatePassword,
  validateName,
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
  Mail,
  Lock,
  User,
  Check,
  X,
} from "lucide-react";

export default function RegisterPage() {
  const { register, googleSignIn } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const requirements = getPasswordRequirements(password);
  const strength = getPasswordStrength(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const nameCheck = validateName(name);
    if (!nameCheck.valid) { setError(nameCheck.error); return; }

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) { setError(emailCheck.error); return; }

    const passCheck = validatePassword(password);
    if (!passCheck.valid) { setError(passCheck.error); return; }

    const confirmCheck = validateConfirmPassword(password, confirmPassword);
    if (!confirmCheck.valid) { setError(confirmCheck.error); return; }

    setIsSubmitting(true);
    const result = await register(name, email, password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccess(result.message || "Account created!");
      // Store the verify token so the verify-email page can access it
      if (result.data?.verifyToken) {
        sessionStorage.setItem("pendingVerifyToken", result.data.verifyToken);
      }
      setTimeout(() => router.push("/verify-email"), 800);
    } else {
      setError(result.error || "Registration failed.");
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
    <AuthLayout title="Create your account" subtitle="Start generating amazing AI content today.">
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

        {/* Name */}
        <div className="space-y-2">
          <label htmlFor="register-name" className="text-sm font-medium text-foreground">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="register-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
            />
          </div>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="register-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label htmlFor="register-password" className="text-sm font-medium text-foreground">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="register-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-12 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
            </button>
          </div>

          {/* Password Strength Bar */}
          {password && (
            <div className="space-y-2.5 animate-fade-in">
              <div className="flex gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 flex-1 rounded-full transition-all duration-500"
                    style={{
                      backgroundColor: i < strength.score ? strength.color : "#E7E0D8",
                    }}
                  />
                ))}
              </div>
              <p className="text-xs font-medium" style={{ color: strength.color }}>
                {strength.label}
              </p>
            </div>
          )}

          {/* Password Requirements */}
          {password && (
            <div className="space-y-1.5 animate-fade-in">
              {requirements.map((req) => (
                <div
                  key={req.label}
                  className={`flex items-center gap-2 text-xs transition-colors duration-300 ${
                    req.met ? "text-emerald-600" : "text-muted-foreground/60"
                  }`}
                >
                  {req.met ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <X className="h-3.5 w-3.5" />
                  )}
                  {req.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label htmlFor="register-confirm" className="text-sm font-medium text-foreground">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="register-confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#D4A843]/50 focus:shadow-[0_0_0_3px_rgba(212,168,67,0.12)]"
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
          className="relative h-12 w-full rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] text-sm font-semibold text-[#D4A843] shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Creating account...
            </span>
          ) : (
            "Create Account"
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

        {/* Login link */}
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-[#B8860B] transition-colors hover:text-[#D4A843]"
          >
            Sign in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}