"use client";

import { ContentProvider } from "@/lib/content-store";

export default function Providers({ children }: { children: React.ReactNode }) {
  return <ContentProvider>{children}</ContentProvider>;
}
