import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Chip } from "@/components/art-ui";

export const Route = createFileRoute("/activity")({
  component: Activity,
});

function Activity() {
  const [tab, setTab] = useState("All");
  const items = [
    ["New offer received", "Ethereal Flow", "$4,800", "2h ago"],
    ["Your artwork sold", "Golden Balance", "$3,800", "5h ago"],
    ["Auction starting soon", "Silent Thoughts", "Starts 8 PM", "1d ago"],
    ["Certificate verified", "Bloom Within", "Provenance secured", "2d ago"],
    ["New follower", "@ArtCollector_82", "Started following you", "3d ago"],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Activity</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {["All", "Offers", "Sales", "Updates"].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-5 space-y-3">
        {items.map(([t, s, v, ti], i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-12 h-12 rounded-xl bg-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{t}</p>
              <p className="text-xs text-muted-foreground truncate">
                {s} · {v}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{ti}</span>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
