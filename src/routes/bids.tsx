import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/bids")({
  component: Bids,
});

function Bids() {
  const items = [
    ["Ethereal Flow", "$5,200", "Highest", "12h left"],
    ["Golden Balance", "$3,800", "Outbid", "2h left"],
    ["Silent Thoughts", "$2,900", "Highest", "5h left"],
    ["Bloom Within", "$3,300", "Won", "Ended"],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">My Bids</h1>
      </div>
      <div className="px-5 mt-4 space-y-3">
        {items.map(([t, p, s, time], i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-accent" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{t}</p>
              <p className="text-xs text-muted-foreground">{time}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-primary">{p}</p>
              <p
                className={`text-[10px] font-bold ${s === "Highest" || s === "Won" ? "text-success" : "text-destructive"}`}
              >
                {s}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
