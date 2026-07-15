import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import Templates from "@/components/features/templates/Templates";

export default function TemplatesPage() {
  return (
    <ProtectedRoute>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-gradient-to-br from-[var(--surface-page)] via-[#F4F0EA] to-[var(--surface-page)] p-10">
          <Templates />
        </main>
      </div>
    </ProtectedRoute>
  );
}