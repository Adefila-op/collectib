import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard, Chip } from "@/components/art-ui";

export const Route = createFileRoute("/artist/$id/artworks")({
  component: ArtistArtworks,
});

function ArtistArtworks() {
  const [tab, setTab] = useState("All");
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Emma Reyes Artworks" />
      <div className="flex gap-2 px-5">
        {["All", "Available", "Sold"].map((t) => (
          <Chip key={t} active={t === tab} onClick={() => setTab(t)}>
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
                "Inner Peace",
                "Broken Lines",
                "Purple Haze",
                "Quiet Storm",
                "Liminal",
              ][i]
            }
            artist="Emma R."
            price={`$${(2500 + i * 350).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </div>
  );
}
