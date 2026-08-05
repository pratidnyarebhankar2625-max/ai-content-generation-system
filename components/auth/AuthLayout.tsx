"use client";

import Link from "next/link";
import { Sparkles, LayoutGrid, FileText, History, Settings } from "lucide-react";

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
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* ── Left Panel — Brand / Illustration ───────────────────────────── */}
      <div className="hidden lg:flex lg:w-[48%] relative overflow-hidden bg-navy-waves bg-[#113680] text-white">
        {/* Decorative ambient lighting spheres */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[10%] left-[5%] h-80 w-80 rounded-full bg-[#fe4443]/15 blur-3xl animate-fade-in" />
          <div className="absolute bottom-[15%] right-[10%] h-96 w-96 rounded-full bg-[#3b82f6]/20 blur-3xl animate-fade-in stagger-2" />
          <div className="absolute top-[50%] left-[40%] h-64 w-64 rounded-full bg-[#fe4443]/10 blur-2xl animate-fade-in stagger-4" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 lg:p-16 w-full">
          {/* Logo */}
          <div className="flex items-center gap-3 animate-fade-in-down">
            <div className="rounded-2xl bg-white p-3 shadow-[0_0_25px_rgba(254,68,67,0.25)] border border-white/20 transition-transform duration-300 hover:scale-105">
              <Sparkles className="h-6 w-6 text-[#113680]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white font-heading">
              AI Content Studio
            </span>
          </div>

          {/* Hero text & Bullets */}
          <div className="space-y-8 animate-fade-in-up my-auto py-8">
            <h2 className="font-heading text-5xl xl:text-6xl font-extrabold leading-[1.1] tracking-tight text-white">
              Create Amazing
              <br />
              AI–Powered
              <br />
              Content
            </h2>

            <ul className="space-y-3.5 pt-2 text-base xl:text-lg font-medium text-slate-200">
              {[
                "Generate SEO-friendly blog posts",
                "Draft outlines and articles",
                "Optimize existing content",
                "Track content performance",
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3.5">
                  <span className="flex h-2.5 w-2.5 shrink-0 rounded-full bg-[#fe4443] shadow-[0_0_10px_#fe4443]" />
                  <span className="text-slate-100">{item}</span>
                </li>
              ))}
            </ul>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 pt-6 border-t border-white/10">
              {[
                { value: "10K+", label: "Happy Creators" },
                { value: "1M+", label: "Articles Generated" },
                { value: "50+", label: "Global Templates" },
              ].map((stat) => (
                <div key={stat.label}>
                  <p className="font-heading text-3xl xl:text-4xl font-extrabold text-[#fe4443] drop-shadow-[0_2px_12px_rgba(254,68,67,0.35)]">
                    {stat.value}
                  </p>
                  <p className="text-xs xl:text-sm font-medium text-slate-300 mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-xs text-slate-400 border-t border-white/10 pt-4 animate-fade-in">
            <span>© {new Date().getFullYear()} AI Content Studio</span>
            <div className="flex gap-4">
              <span className="hover:text-white cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-white cursor-pointer transition-colors">Terms</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Panel — Form & Interactive Preview ────────────────────── */}
      <div className="flex flex-1 flex-col bg-[#f8fafc] bg-dot-texture relative overflow-y-auto">
        {/* Mobile logo */}
        <div className="flex items-center gap-3 p-6 lg:hidden border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
          <div className="rounded-xl bg-[#113680] p-2.5 shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-[#113680]">
            AI Content Studio
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-12 relative z-10">
          <div className="w-full max-w-[440px] space-y-8 animate-fade-in-up">
            {/* Page header */}
            <div className="space-y-2 text-center">
              <h1 className="font-heading text-[40px] md:text-[56px] font-bold leading-[1.1] tracking-tight text-[#113680]">
                {title}
              </h1>
              {subtitle && <p className="text-sm text-slate-500 font-medium">{subtitle}</p>}
            </div>

            {children}
          </div>
        </div>

      </div>
    </div>
  );
}
