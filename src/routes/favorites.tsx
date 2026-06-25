import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";

export const Route = createFileRoute("/favorites")({
  component: Favorites,
});

function Favorites() {
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Favorites</h1>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
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
              ][i]
            }
            artist={["Emma R.", "Luca M.", "Zara K.", "Tima B.", "Kwame A.", "Amina D."][i]}
            price={`$${(2500 + i * 400).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </MobileShell>
  );
}
