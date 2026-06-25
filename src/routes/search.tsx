import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard, Chip } from "@/components/art-ui";
import { Search as SearchIcon, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/search")({
  component: Search,
});

function Search() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Search" />
      <div className="px-5 flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
          <SearchIcon size={16} className="text-muted-foreground" />
          <input
            defaultValue="abstract painting"
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <Link
          to="/search/filters"
          className="w-12 h-12 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center"
        >
          <SlidersHorizontal size={16} />
        </Link>
      </div>
      <p className="px-5 mt-4 text-xs text-muted-foreground">24 results</p>
      <div className="grid grid-cols-2 gap-3 px-5 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArtworkCard
            key={i}
            id={String(i + 1)}
            title={["Ethereal Flow", "Inner Peace", "Silent Thoughts", "Bloom Within"][i]}
            artist={["Emma R.", "Kwame A.", "Zara K.", "Tima B."][i]}
            price={`$${(2000 + i * 400).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </div>
  );
}
