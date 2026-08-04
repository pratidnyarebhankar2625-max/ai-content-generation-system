"use client";

import { AuthProvider } from "@/lib/auth-store";
import { SettingsProvider } from "@/lib/settings-store";
import { ContentProvider } from "@/lib/content-store";
import { DashboardProvider } from "@/lib/dashboard-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SettingsProvider>
        <ContentProvider>
          <DashboardProvider>{children}</DashboardProvider>
        </ContentProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
