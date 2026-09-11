"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-store";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
  getPasswordRequirements,
  getPasswordStrength,
} from "@/lib/auth-validators";
import AuthLayout from "@/components/auth/AuthLayout";
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Lock,
  RefreshCw,
  Check,
  X,
  KeyRound,
} from "lucide-react";

type RecoveryStep = "request" | "otp" | "new_password" | "success";

export default function ForgotPasswordPage() {
  const { forgotPassword, verifyRecoveryOtp, resendForgotPasswordOtp, resetPassword } = useAuth();

  const [step, setStep] = useState<RecoveryStep>("request");
  const [identifier, setIdentifier] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [infoMessage, setInfoMessage] = useState("");

  // Resend cooldown timer (60s)
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Auto focus first OTP input when step changes to OTP
  useEffect(() => {
    if (step === "otp" && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [step]);

  // Handle Step 1: Send OTP
  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const cleanId = identifier.trim();
    if (!cleanId) {
      setError("Please enter your registered email address or mobile number.");
      return;
    }

    const isPhone = /^\+?[0-9\s\-()]{7,20}$/.test(cleanId) && !cleanId.includes("@");
    if (!isPhone) {
      const emailCheck = validateEmail(cleanId);
      if (!emailCheck.valid) {
        setError(emailCheck.error);
        return;
      }
    }

    setIsSubmitting(true);
    const result = await forgotPassword(cleanId);
    setIsSubmitting(false);

    if (result.success) {
      setStep("otp");
      setCooldown(60);
      setInfoMessage(result.message || "Recovery OTP sent successfully.");
    } else {
      setError(result.error || "Failed to send recovery OTP.");
    }
  }

  // OTP digit input handler
  function handleOtpChange(index: number, value: string) {
    if (value.length > 1) {
      // Handle pasting multi-digit code
      const pasted = value.replace(/\D/g, "").slice(0, 6);
      if (pasted.length > 0) {
        const newDigits = [...otpDigits];
        for (let i = 0; i < 6; i++) {
          newDigits[i] = pasted[i] || "";
        }
        setOtpDigits(newDigits);
        const focusIdx = Math.min(pasted.length, 5);
        inputRefs.current[focusIdx]?.focus();
      }
      return;
    }

    const digit = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    newDigits[index] = digit;
    setOtpDigits(newDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  // Handle Step 2: Verify OTP
  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfoMessage("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP code.");
      return;
    }

    setIsSubmitting(true);
    const result = await verifyRecoveryOtp(identifier, fullOtp);
    setIsSubmitting(false);

    if (result.success) {
      setStep("new_password");
      setInfoMessage("OTP verified successfully! Create your new password.");
    } else {
      setError(result.error || "Invalid or expired OTP code.");
    }
  }

  // Handle Resend OTP
  async function handleResendOtp() {
    if (cooldown > 0 || isSubmitting) return;
    setError("");
    setInfoMessage("");

    setIsSubmitting(true);
    const result = await resendForgotPasswordOtp(identifier);
    setIsSubmitting(false);

    if (result.success) {
      setCooldown(60);
      setOtpDigits(["", "", "", "", "", ""]);
      setInfoMessage("A new 6-digit OTP code has been sent.");
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    } else {
      setError(result.error || "Failed to resend OTP.");
    }
  }

  // Handle Step 3: Save New Password
  async function handleSaveNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const passCheck = validatePassword(newPassword);
    if (!passCheck.valid) {
      setError(passCheck.error);
      return;
    }

    const confirmCheck = validateConfirmPassword(newPassword, confirmPassword);
    if (!confirmCheck.valid) {
      setError(confirmCheck.error);
      return;
    }

    setIsSubmitting(true);
    const result = await resetPassword(newPassword);
    setIsSubmitting(false);

    if (result.success) {
      setStep("success");
    } else {
      setError(result.error || "Failed to update password.");
    }
  }

  const requirements = getPasswordRequirements(newPassword);
  const strength = getPasswordStrength(newPassword);

  // ── Step 1: Request OTP Screen ──────────────────────────────────────────
  if (step === "request") {
    return (
      <AuthLayout
        title="Forgot password?"
        subtitle="Enter your registered email or mobile number to receive a 6-digit recovery OTP."
      >
        <form onSubmit={handleSendOtp} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="forgot-identifier" className="text-sm font-medium text-foreground">
              Email Address or Mobile Number
            </label>
            <div className="relative">
              {/^\+?[0-9\s\-()]{7,}$/.test(identifier.trim()) && !identifier.includes("@") ? (
                <Phone className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
              ) : (
                <Mail className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
              )}
              <input
                id="forgot-identifier"
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="you@example.com or +1234567890"
                autoComplete="username"
                className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#113680]/50 focus:shadow-[0_0_0_3px_rgba(17,54,128,0.15)]"
              />
            </div>
            <p className="text-xs text-muted-foreground/80">
              OTP recovery is sent via email or SMS (SMS requires Supabase Phone Auth).
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="relative h-12 w-full rounded-xl bg-[#113680] text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all duration-300 hover:bg-[#0d2960] hover:shadow-lg hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending Recovery OTP...
              </span>
            ) : (
              "Send Recovery OTP"
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

  // ── Step 2: OTP Verification Screen ────────────────────────────────────
  if (step === "otp") {
    return (
      <AuthLayout
        title="Enter Verification Code"
        subtitle={`We've sent a 6-digit OTP code to verify account ownership.`}
      >
        <form onSubmit={handleVerifyOtp} className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#113680]/15 to-[#113680]/5">
                <KeyRound className="h-8 w-8 text-[#113680]" />
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Recipient: <span className="font-semibold text-foreground">{identifier}</span>
          </p>

          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {infoMessage && !error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm text-emerald-700 animate-fade-in-down">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {infoMessage}
            </div>
          )}

          {/* 6-Digit Inputs */}
          <div className="space-y-2">
            <label className="text-center block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              6-Digit Recovery OTP
            </label>
            <div className="flex justify-center gap-2.5">
              {otpDigits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-13 w-11 rounded-xl border-2 border-border bg-[var(--surface-input)] text-center text-xl font-bold text-foreground transition-all duration-200 focus:border-[#113680] focus:bg-[var(--surface-card)] focus:outline-none focus:shadow-[0_0_0_3px_rgba(17,54,128,0.15)]"
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || otpDigits.join("").length < 6}
            className="relative h-12 w-full rounded-xl bg-[#113680] text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all duration-300 hover:bg-[#0d2960] hover:shadow-lg hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying OTP...
              </span>
            ) : (
              "Verify OTP"
            )}
          </button>

          {/* Resend Cooldown */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={() => {
                setStep("request");
                setError("");
                setInfoMessage("");
              }}
              className="text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              Change email/mobile
            </button>

            {cooldown > 0 ? (
              <span className="text-muted-foreground font-medium">
                Resend OTP in <span className="text-[#113680] font-bold">{cooldown}s</span>
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 font-semibold text-[#fe4443] transition-colors hover:underline disabled:opacity-50"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Resend OTP
              </button>
            )}
          </div>
        </form>
      </AuthLayout>
    );
  }

  // ── Step 3: Create New Password Screen ─────────────────────────────────
  if (step === "new_password") {
    return (
      <AuthLayout
        title="Create New Password"
        subtitle="OTP verified! Choose a strong new password for your account."
      >
        <form onSubmit={handleSaveNewPassword} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-700 animate-fade-in-down">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <label htmlFor="recovery-password" className="text-sm font-medium text-foreground">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
              <input
                id="recovery-password"
                type={showPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Create a strong password"
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-12 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#113680]/50 focus:shadow-[0_0_0_3px_rgba(17,54,128,0.15)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground/50 transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
              </button>
            </div>

            {/* Strength indicator */}
            {newPassword && (
              <div className="space-y-2.5 animate-fade-in pt-1">
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="h-1.5 flex-1 rounded-full transition-all duration-500"
                      style={{
                        backgroundColor: i < strength.score ? strength.color : "#e2e8f0",
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
            {newPassword && (
              <div className="space-y-1.5 animate-fade-in pt-1">
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
            <label htmlFor="recovery-confirm" className="text-sm font-medium text-foreground">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-muted-foreground/60" />
              <input
                id="recovery-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                className="h-12 w-full rounded-xl border border-border bg-[var(--surface-input)] pl-11 pr-4 text-sm transition-all duration-300 placeholder:text-muted-foreground/50 focus:outline-none focus:bg-[var(--surface-card)] focus:border-[#113680]/50 focus:shadow-[0_0_0_3px_rgba(17,54,128,0.15)]"
              />
              {confirmPassword && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  {newPassword === confirmPassword ? (
                    <CheckCircle2 className="h-[18px] w-[18px] text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-[18px] w-[18px] text-red-400" />
                  )}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="relative h-12 w-full rounded-xl bg-[#113680] text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all duration-300 hover:bg-[#0d2960] hover:shadow-lg hover:scale-[1.01] disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving New Password...
              </span>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>
      </AuthLayout>
    );
  }

  // ── Step 4: Success Screen ──────────────────────────────────────────────
  return (
    <AuthLayout
      title="Password Reset Successful"
      subtitle="Your account password has been updated. You can now sign in with your new password."
    >
      <div className="space-y-6">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-50 animate-scale-in">
            <ShieldCheck className="h-10 w-10 text-emerald-600" />
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Account recovery complete. Click below to return to the sign-in page.
        </p>

        <Link
          href="/login"
          className="flex h-12 w-full items-center justify-center rounded-xl bg-[#113680] text-sm font-semibold text-white shadow-md shadow-[#113680]/20 transition-all duration-300 hover:bg-[#0d2960] hover:shadow-lg hover:scale-[1.01]"
        >
          Sign In with New Password →
        </Link>
      </div>
    </AuthLayout>
  );
}
