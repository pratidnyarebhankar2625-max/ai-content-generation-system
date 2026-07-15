"use client";

import { AuthProvider } from "@/lib/auth-store";
import { ContentProvider } from "@/lib/content-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ContentProvider>{children}</ContentProvider>
    </AuthProvider>
  );
}
