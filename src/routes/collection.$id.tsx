import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";

export const Route = createFileRoute("/collection/$id")({
  component: Collection,
});

function Collection() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Collection Detail" />
      <div className="mx-5 rounded-3xl overflow-hidden aspect-[5/3] bg-accent">
        <svg viewBox="0 0 300 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <rect width="300" height="180" fill="#E8DFF5" />
          <ellipse cx="100" cy="90" rx="60" ry="80" fill="#2D1B4E" />
          <ellipse cx="220" cy="120" rx="40" ry="50" fill="#1A1A1A" opacity="0.6" />
        </svg>
      </div>
      <div className="px-5 mt-5">
        <h1 className="text-2xl font-extrabold">Lagos Moderns</h1>
        <p className="text-xs text-muted-foreground mt-1">Curated by Tima Bouzid</p>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          A curated collection of modern and contemporary art from Lagos-based artists.
        </p>
        <p className="text-xs text-muted-foreground mt-3">24 Artworks</p>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArtworkCard
            key={i}
            id={String(i + 1)}
            title={["Ethereal Flow", "Golden Balance", "Silent Thoughts", "Bloom Within"][i]}
            artist={["Emma R.", "Luca M.", "Zara K.", "Tima B."][i]}
            variant={i}
          />
        ))}
      </div>
    </div>
  );
}
