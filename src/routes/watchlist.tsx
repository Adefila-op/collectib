import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/watchlist")({
  component: Watchlist,
});

function Watchlist() {
  const items = [
    ["Echoes of Time", "Kwame Asante", "$5,600", 0],
    ["Rhythm of Life", "Amina Diallo", "$4,100", 1],
    ["Urban Dreams", "Tunde Adebayo", "$3,750", 2],
    ["Colors of Heritage", "Fatou Ndiaye", "$2,900", 3],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Watchlist</h1>
      </div>
      <div className="px-5 mt-4 space-y-3">
        {items.map(([t, a, p, v], i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-16 h-16 rounded-xl overflow-hidden bg-accent">
              <BlobMini variant={v as number} />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{t as string}</p>
              <p className="text-xs text-muted-foreground">{a as string}</p>
            </div>
            <p className="font-bold text-sm text-primary">{p as string}</p>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

function BlobMini({ variant }: { variant: number }) {
  const c = ["#E8DFF5", "#FFE9DC", "#F5EFE6", "#EDE7FF"];
  return (
    <svg viewBox="0 0 64 64" className="w-full h-full">
      <rect width="64" height="64" fill={c[variant % 4]} />
      <ellipse cx="28" cy="32" rx="18" ry="22" fill="#1A1A1A" opacity="0.85" />
    </svg>
  );
}
