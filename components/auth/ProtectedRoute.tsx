"use client";

import { useAuth } from "@/lib/auth-store";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen flex-col overflow-hidden bg-[var(--surface-page)]">
        {/* Navbar Shell Placeholder */}
        <div className="h-16 w-full border-b border-border bg-card px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
            <div className="h-6 w-28 rounded-lg bg-muted animate-pulse hidden sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-muted animate-pulse" />
            <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        {/* Sidebar & Content Shell Placeholder */}
        <div className="flex flex-1 overflow-hidden">
          <div className="hidden lg:flex w-72 flex-col border-r border-border bg-sidebar p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-12 w-full rounded-xl bg-muted/60 animate-pulse" />
            ))}
          </div>
          <main className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
            <div className="h-10 w-64 rounded-xl bg-muted animate-pulse" />
            <div className="grid gap-6 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 rounded-2xl border border-border bg-card p-4 space-y-3 animate-pulse">
                  <div className="h-4 w-24 rounded bg-muted" />
                  <div className="h-8 w-16 rounded bg-muted" />
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
