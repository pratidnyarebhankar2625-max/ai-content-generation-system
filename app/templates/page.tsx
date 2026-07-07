import SearchBar from "@/components/features/templates/SearchBar";
import TemplatesGrid from "@/components/features/templates/TemplatesGrid";

export default function TemplatesPage() {
  return (
    <main className="p-8">
      <h1 className="text-4xl font-bold">Templates</h1>

      <SearchBar />

      <TemplatesGrid />
    </main>
  );
}