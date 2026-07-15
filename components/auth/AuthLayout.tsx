"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex min-h-screen">
      {/* ── Left Panel — Brand / Illustration ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-gradient-to-br from-[#1C1917] via-[#292524] to-[#0C0A09]">
        {/* Decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-[15%] left-[10%] h-72 w-72 rounded-full bg-[#D4A843]/8 blur-3xl animate-fade-in" />
          <div className="absolute bottom-[20%] right-[5%] h-96 w-96 rounded-full bg-[#B8860B]/6 blur-3xl animate-fade-in stagger-2" />
          <div className="absolute top-[60%] left-[30%] h-48 w-48 rounded-full bg-[#D4A843]/4 blur-2xl animate-fade-in stagger-4" />
        </div>

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(212,168,67,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in-down">
            <div className="rounded-2xl bg-gradient-to-br from-[#D4A843] via-[#B8860B] to-[#8B6914] p-3 shadow-[0_0_25px_rgba(212,168,67,0.3)]">
              <Sparkles className="h-6 w-6 text-[#1C1917]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-[#FAF8F5]">
              AI Content Studio
            </span>
          </div>

          {/* Hero text */}
          <div className="space-y-6 animate-fade-in-up">
            <h2 className="font-heading text-4xl font-bold leading-tight tracking-tight text-[#FAF8F5]">
              Create Amazing
              <br />
              <span className="bg-gradient-to-r from-[#D4A843] to-[#B8860B] bg-clip-text text-transparent">
                AI-Powered
              </span>
              <br />
              Content
            </h2>
            <p className="max-w-md text-base leading-relaxed text-[#A8A29E]">
              Generate blog posts, emails, social media content, and more with
              your personal AI assistant. Faster, smarter, better.
            </p>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              {[
                { value: "10K+", label: "Users" },
                { value: "1M+", label: "Generations" },
                { value: "50+", label: "Templates" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-2xl font-bold text-[#D4A843]">
                    {stat.value}
                  </p>
                  <p className="text-xs text-[#78716C]">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-xs text-[#44403C] animate-fade-in">
            © {new Date().getFullYear()} AI Content Studio. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Right Panel — Form ──────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col bg-gradient-to-br from-[var(--surface-page)] via-[#F4F0EA] to-[var(--surface-page)]">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 p-6 lg:hidden">
          <div className="rounded-xl bg-gradient-to-br from-[#D4A843] to-[#B8860B] p-2.5 shadow-md">
            <Sparkles className="h-5 w-5 text-[#1C1917]" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">
            AI Content Studio
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-8 sm:px-12">
          <div className="w-full max-w-[440px] space-y-8 animate-fade-in-up">
            {/* Page header */}
            <div className="space-y-2">
              <h1 className="font-heading text-3xl font-bold tracking-tight text-foreground">
                {title}
              </h1>
              <p className="text-base text-muted-foreground">{subtitle}</p>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
