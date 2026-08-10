"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service in production
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in-up text-center">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-3xl bg-destructive/10 shadow-inner">
          <AlertTriangle className="h-12 w-12 text-destructive" />
        </div>
        
        <h1 className="mb-3 font-heading text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Something went wrong
        </h1>
        
        <p className="mb-10 text-lg text-muted-foreground">
          We encountered an unexpected error while processing your request. Please try again or return to the dashboard.
        </p>

        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <button
            onClick={() => reset()}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 sm:w-auto"
          >
            <RotateCcw className="h-4 w-4 transition-transform group-hover:-rotate-90" />
            Try Again
          </button>
          
          <Link
            href="/"
            className="group flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:w-auto"
          >
            <Home className="h-4 w-4 transition-transform group-hover:scale-110" />
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
