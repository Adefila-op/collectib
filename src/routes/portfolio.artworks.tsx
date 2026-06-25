import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard, Chip } from "@/components/art-ui";

export const Route = createFileRoute("/portfolio/artworks")({
  component: Artworks,
});

function Artworks() {
  const [tab, setTab] = useState("Owned");
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">My Artworks</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {["Owned", "Watchlist", "Sold"].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
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
