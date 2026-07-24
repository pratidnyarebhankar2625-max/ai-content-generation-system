import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import PageTransition from "@/components/layout/PageTransition";
import { SidebarProvider } from "@/lib/sidebar-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex h-screen flex-col overflow-hidden">
        <Navbar />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto bg-gradient-to-br from-[var(--surface-page)] via-[#F5EFEB] to-[var(--surface-page)]">
            <PageTransition>{children}</PageTransition>
          </main>
        </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
}
