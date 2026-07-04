import WelcomeSection from "@/components/features/dashboard/WelcomeSection";
import StatsCards from "@/components/features/dashboard/StatsCards";
import QuickActions from "@/components/features/dashboard/QuickActions";
import RecentProjects from "@/components/features/dashboard/RecentProjects";

export default function DashboardPage() {
  return (
    <main className="p-8">
      <WelcomeSection />
      <StatsCards />
      <QuickActions />
      <RecentProjects />
    </main>
  );
}