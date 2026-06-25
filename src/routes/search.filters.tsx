import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Chip, PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/search/filters")({
  component: Filters,
});

function Filters() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Filters" />
      <div className="px-5 space-y-6">
        <div>
          <h2 className="font-semibold mb-3">Price Range</h2>
          <p className="text-sm text-muted-foreground">$0 – $10,000+</p>
          <input type="range" className="w-full accent-primary mt-2" />
        </div>
        <div>
          <h2 className="font-semibold mb-3">Medium</h2>
          <div className="flex flex-wrap gap-2">
            {["All", "Painting", "Sculpture", "Photography"].map((m, i) => (
              <Chip key={m} active={i === 0}>
                {m}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-semibold mb-3">Year</h2>
          <div className="flex flex-wrap gap-2">
            {["All", "2025", "2024", "2023", "2022"].map((y, i) => (
              <Chip key={y} active={i === 0}>
                {y}
              </Chip>
            ))}
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton to="/search">Apply Filters</PrimaryButton>
      </div>
    </div>
  );
}
