
import WelcomeSection from "@/components/features/dashboard/WelcomeSection";
import StatsCards from "@/components/features/dashboard/StatsCards";
import AnalyticsChart from "@/components/features/dashboard/AnalyticsChart";
import QuickActions from "@/components/features/dashboard/QuickActions";

export default function HomePage() {
  return (
    <div className="p-10 space-y-12">
      <WelcomeSection />
      <StatsCards />
      {/* Two-column layout: Quick Actions + Analytics */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <QuickActions />
        </div>
        <div className="lg:col-span-2">
          <AnalyticsChart />
        </div>
      </div>
    </div>
  );
}