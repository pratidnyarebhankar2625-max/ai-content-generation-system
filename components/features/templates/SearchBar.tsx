import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="relative mb-8 max-w-xl">
      <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />

      <input
        type="text"
        placeholder="Search templates..."
        className="
          w-full
          rounded-xl
          border
          bg-background
          py-3
          pl-12
          pr-4
          outline-none
          transition
          focus:ring-2
          focus:ring-primary
        "
      />
    </div>
  );
}