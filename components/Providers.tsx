"use client";

import { AuthProvider } from "@/lib/auth-store";
import { SettingsProvider } from "@/lib/settings-store";
import { ContentProvider } from "@/lib/content-store";
import { DashboardProvider } from "@/lib/dashboard-store";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <SettingsProvider>
          <ContentProvider>
            <DashboardProvider>
              {children}
              <Toaster />
            </DashboardProvider>
          </ContentProvider>
        </SettingsProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
