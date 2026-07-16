"use client";

import { AuthProvider } from "@/lib/auth-store";
import { ContentProvider } from "@/lib/content-store";
import { DashboardProvider } from "@/lib/dashboard-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ContentProvider>
        <DashboardProvider>{children}</DashboardProvider>
      </ContentProvider>
    </AuthProvider>
  );
}
