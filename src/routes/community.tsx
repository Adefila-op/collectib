import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/community")({
  component: Community,
});

function Community() {
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Community</h1>
      </div>
      <h2 className="px-5 mt-5 font-semibold">Top Collectors</h2>
      <div className="mx-5 mt-3 rounded-2xl bg-surface border border-border divide-y divide-border">
        {[
          ["ArtLover_88", "$1.2M"],
          ["FineArtCollector", "$980K"],
          ["ModernArtFan", "$750K"],
        ].map(([n, v]) => (
          <div key={n} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent" />
              <span className="font-medium text-sm">{n}</span>
            </div>
            <span className="font-semibold text-sm">{v}</span>
          </div>
        ))}
      </div>

      <h2 className="px-5 mt-6 font-semibold">Curated Collections</h2>
      <div className="grid grid-cols-2 gap-3 px-5 mt-3">
        {[
          ["African Women Artists", "12 Artworks"],
          ["Emerging Talents", "24 Artworks"],
        ].map(([t, c], i) => (
          <div key={i} className="rounded-2xl overflow-hidden">
            <div className="h-28 bg-accent" />
            <p className="font-semibold text-sm mt-2">{t}</p>
            <p className="text-xs text-muted-foreground">{c}</p>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
