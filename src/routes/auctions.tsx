import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { BlobArt, Chip } from "@/components/art-ui";
import { useState } from "react";

export const Route = createFileRoute("/auctions")({
  component: Auctions,
});

function Auctions() {
  const [tab, setTab] = useState("Live");
  const items = [
    ["Ethereal Flow", "Emma Reyes", "$5,200", "12h 34m", 0],
    ["Golden Balance", "Luca Moretti", "$3,800", "2h 10m", 1],
    ["Silent Thoughts", "Zara Karim", "$2,900", "5h 02m", 2],
    ["Bloom Within", "Tima B.", "$3,300", "1d 4h", 3],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Live Auctions</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {["Live", "Upcoming", "Ended"].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-5 space-y-3">
        {items.map(([t, a, p, time, v], i) => (
          <Link
            key={i}
            to="/auction/$id"
            params={{ id: String(i + 1) }}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0">
              <BlobArt variant={v as number} className="w-full h-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{t as string}</p>
              <p className="text-xs text-muted-foreground truncate">by {a as string}</p>
              <p className="text-[10px] text-destructive mt-1 font-semibold">
                ● {time as string} left
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Current</p>
              <p className="font-bold text-sm text-primary">{p as string}</p>
            </div>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
