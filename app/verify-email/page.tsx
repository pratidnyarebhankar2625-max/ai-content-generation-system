"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  ArrowLeft,
  RefreshCw,
  ArrowRight,
} from "lucide-react";

export default function VerifyEmailPage() {
  const { user, verifyEmail, resendVerification } = useAuth();
  const router = useRouter();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState("");
  const [verified, setVerified] = useState(false);
  const [resent, setResent] = useState(false);
  const [verifyToken, setVerifyToken] = useState("");

  // Get the verify token from sessionStorage (set during registration)
  useEffect(() => {
    const token = sessionStorage.getItem("pendingVerifyToken");
    if (token) {
      setVerifyToken(token);
    }
  }, []);

  // If user is already verified, show success
  useEffect(() => {
    if (user?.isVerified) {
      setVerified(true);
    }
  }, [user]);

  async function handleVerify() {
    if (!verifyToken) {
      setError("No verification token found. Please resend.");
      return;
    }

    setError("");
    setIsVerifying(true);
    const result = await verifyEmail(verifyToken);
    setIsVerifying(false);

    if (result.success) {
      setVerified(true);
      sessionStorage.removeItem("pendingVerifyToken");
    } else {
      setError(result.error || "Verification failed.");
    }
  }

  async function handleResend() {
    setError("");
    setResent(false);
    setIsResending(true);
    const result = await resendVerification();
    setIsResending(false);

    if (result.success) {
      setResent(true);
      if (result.data?.verifyToken) {
        setVerifyToken(result.data.verifyToken);
        sessionStorage.setItem("pendingVerifyToken", result.data.verifyToken);
      }
    } else {
      setError(result.error || "Failed to resend.");
    }
  }

  if (verified) {
    return (
      <AuthLayout title="Email verified!" subtitle="Your email has been verified successfully.">
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative animate-scale-in">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Your account is fully set up. You can now access all features.
          </p>

          <button
            onClick={() => router.push("/")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] text-sm font-semibold text-[#D4A843] shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01]"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify your email" subtitle="We need to verify your email address.">
      <div className="space-y-6">
        {error && (
          <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {resent && (
          <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 animate-fade-in-down">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Verification email resent!
          </div>
        )}

        {/* Mail illustration */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#D4A843]/15 to-[#B8860B]/10 animate-scale-in">
              <Mail className="h-9 w-9 text-[#B8860B]" />
            </div>
            {/* Animated dots */}
            <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-[#D4A843] animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="absolute -top-1 right-4 h-2 w-2 rounded-full bg-[#D4A843]/60 animate-bounce" style={{ animationDelay: "200ms" }} />
            <div className="absolute top-3 -right-3 h-2 w-2 rounded-full bg-[#D4A843]/40 animate-bounce" style={{ animationDelay: "400ms" }} />
          </div>
        </div>

        <div className="space-y-2 text-center">
          <p className="text-sm text-muted-foreground">
            {user ? (
              <>
                We sent a verification email to{" "}
                <span className="font-semibold text-foreground">{user.email}</span>.
              </>
            ) : (
              "Please check your inbox for a verification link."
            )}
          </p>
        </div>

        {/* Verify button (simulated) */}
        <div className="rounded-xl border border-[#D4A843]/20 bg-[#D4A843]/5 p-4 space-y-3">
          <p className="text-xs text-[#B8860B] font-medium">
            ✨ Demo: Click below to simulate clicking the verification link from your email
          </p>
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1C1917] to-[#292524] text-sm font-semibold text-[#D4A843] shadow-[var(--shadow-button)] transition-all duration-300 hover:shadow-[var(--shadow-card-hover)] hover:scale-[1.01] disabled:opacity-60"
          >
            {isVerifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Verify My Email
              </>
            )}
          </button>
        </div>

        {/* Resend */}
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Didn&apos;t receive it?</span>
          <button
            onClick={handleResend}
            disabled={isResending}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#B8860B] transition-colors hover:text-[#D4A843] disabled:opacity-60"
          >
            {isResending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Resend
          </button>
        </div>

        {/* Skip / Back */}
        <div className="flex items-center justify-between">
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to login
          </Link>
          <button
            onClick={() => router.push("/")}
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip for now →
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}
