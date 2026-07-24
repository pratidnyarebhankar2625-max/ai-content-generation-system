"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import { validateEmail } from "@/lib/auth-validators";
import AuthLayout from "@/components/auth/AuthLayout";
import { Loader2, CheckCircle2, AlertCircle, Mail, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const { forgotPassword } = useAuth();

  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [resetToken, setResetToken] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) {
      setError(emailCheck.error);
      return;
    }

    setIsSubmitting(true);
    const result = await forgotPassword(email);
    setIsSubmitting(false);

    if (result.success) {
      setSent(true);
      if (result.data?.resetToken) {
        setResetToken(result.data.resetToken);
      }
    } else {
      setError(result.error || "Something went wrong.");
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your email" subtitle="We've sent a password reset link.">
        <div className="space-y-6">
          {/* Success Illustration */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#567C8D]/15 to-[#567C8D]/10 animate-scale-in">
                <Mail className="h-9 w-9 text-primary-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 shadow-lg animate-scale-in stagger-2">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>

          <div className="space-y-2 text-center">
            <p className="text-sm text-muted-foreground">
              We sent a reset link to <span className="font-semibold text-foreground">{email}</span>.
              Check your inbox and follow the instructions.
            </p>
          </div>

          {/* Simulated direct link (since no real email) */}
          <div className="rounded-xl border-transparent bg-[#567C8D]/5 p-4">
            <p className="text-xs text-primary-foreground font-medium mb-2">
              ✨ Demo: Click below to simulate clicking the email link
            </p>
            <Link
              href={`/reset-password?token=${resetToken}`}
              className="inline-flex items-center gap-2 rounded-lg bg-[#567C8D]/15 px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-[#567C8D]/25"
            >
              Reset My Password →
            </Link>
          </div>

          <div className="space-y-3">
            <p className="text-center text-xs text-muted-foreground">
              Didn&apos;t receive an email? Check spam or{" "}
              <button
                onClick={() => setSent(false)}
                className="font-semibold text-primary-foreground hover:text-primary-foreground"
              >
                try again
              </button>
            </p>

            <Link
              href="/login"
              className="flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Forgot password?" subtitle="Enter your email and we'll send you a reset link.">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label htmlFor="forgot-email" className="text-sm font-medium text-foreground">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
            <input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#567C8D]/50 focus:shadow-[0_0_0_3px_rgba(86, 124, 141,0.12)]"
            />
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
              Sending link...
            </span>
          ) : (
            "Send Reset Link"
          )}
        </button>

        {/* Back to login */}
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
