import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

import WelcomeSection from "@/components/features/dashboard/WelcomeSection";
import StatsCards from "@/components/features/dashboard/StatsCards";
import QuickActions from "@/components/features/dashboard/QuickActions";
import RecentProjects from "@/components/features/dashboard/RecentProjects";

export default function HomePage() {
  return (
    <ProtectedRoute>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-gradient-to-br from-[var(--surface-page)] via-[#F4F0EA] to-[var(--surface-page)] p-10">
          <div className="space-y-12">
            <WelcomeSection />
            <StatsCards />
            <QuickActions />
            <RecentProjects />
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}