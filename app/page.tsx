import Navbar from "@/components/layout/Navbar";
import Sidebar from "@/components/layout/Sidebar";

export default function HomePage() {
  return (
    <>
      <Navbar />

      <div className="flex">
        <Sidebar />

        <main className="flex-1 p-6">
          <h1 className="text-2xl font-bold">
            AI Content Generation System
          </h1>
        </main>
      </div>
    </>
  );
}