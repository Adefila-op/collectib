import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/collections")({
  component: Collections,
});

function Collections() {
  const items = [
    ["Lagos Moderns", "24 Artworks"],
    ["African Contemporary", "18 Artworks"],
    ["Black & White Photography", "16 Artworks"],
    ["Nature Inspired", "27 Artworks"],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Collections</h1>
        <Link to="/create-collection" className="text-sm text-primary font-semibold">
          + New
        </Link>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">All Collections</p>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {items.map(([t, c], i) => (
          <Link key={i} to="/collection/$id" params={{ id: String(i + 1) }}>
            <div className="rounded-2xl overflow-hidden h-32">
              <svg viewBox="0 0 160 130" className="w-full h-full">
                <rect
                  width="160"
                  height="130"
                  fill={["#E8DFF5", "#FFE9DC", "#F5EFE6", "#EDE7FF"][i]}
                />
                <ellipse cx="60" cy="65" rx="35" ry="45" fill="#1A1A1A" opacity="0.85" />
              </svg>
            </div>
            <p className="font-semibold text-sm mt-2">{t}</p>
            <p className="text-xs text-muted-foreground">{c}</p>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
