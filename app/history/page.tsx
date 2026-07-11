import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";
import HistoryContent from "@/components/features/history/HistoryContent";

export default function HistoryPage() {
  return (
    <>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 bg-gradient-to-br from-[var(--surface-page)] via-[#F4F0EA] to-[var(--surface-page)] p-10">
          <HistoryContent />
        </main>
      </div>
    </>
  );
}