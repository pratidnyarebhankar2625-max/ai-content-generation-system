import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import GenerateWorkspace from "@/components/features/generate/GenerateWorkspace";

// The Page props format for Next.js App Router dynamic routes
export default async function GeneratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const templateId = parseInt(id, 10);

  return (
    <ProtectedRoute>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-gradient-to-br from-[var(--surface-page)] via-[#F4F0EA] to-[var(--surface-page)] p-10 h-screen overflow-y-auto">
          <GenerateWorkspace templateId={templateId} />
        </main>
      </div>
    </ProtectedRoute>
  );
}
