import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

const SeoContent = dynamic(() => import("@/components/features/seo/SeoContent"), {
  loading: () => (
    <div className="mx-auto max-w-7xl space-y-8 p-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <Skeleton className="h-6 w-96 rounded-lg" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-[500px] lg:col-span-2 rounded-2xl" />
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    </div>
  ),
});

export const metadata = {
  title: "SEO Assistant | Writeora",
  description: "Optimize your AI generated content for search engines.",
};

export default function SeoPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
      <SeoContent />
    </div>
  );
}
