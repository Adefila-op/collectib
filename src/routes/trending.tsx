import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";

export const Route = createFileRoute("/trending")({
  component: Trending,
});

function Trending() {
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Trending</h1>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Top artworks this week</p>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ArtworkCard
            key={i}
            id={String(i + 1)}
            title={
              [
                "Ethereal Flow",
                "Golden Balance",
                "Silent Thoughts",
                "Bloom Within",
                "Inner Peace",
                "Purple Haze",
                "Broken Lines",
                "Quiet Storm",
              ][i]
            }
            artist={
              [
                "Emma R.",
                "Luca M.",
                "Zara K.",
                "Tima B.",
                "Kwame A.",
                "Amina D.",
                "Fatou N.",
                "Tunde A.",
              ][i]
            }
            price={`$${(2200 + i * 380).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </MobileShell>
  );
}
