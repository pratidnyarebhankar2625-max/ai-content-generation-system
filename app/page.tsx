import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

import WelcomeSection from "@/components/features/dashboard/WelcomeSection";
import StatsCards from "@/components/features/dashboard/StatsCards";
import QuickActions from "@/components/features/dashboard/QuickActions";
import RecentProjects from "@/components/features/dashboard/RecentProjects";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-8">
          <WelcomeSection />
          <StatsCards />
          <QuickActions />
          <RecentProjects />
        </main>
      </div>
    </>
  );
}