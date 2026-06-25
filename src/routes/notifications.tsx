import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

function Notifications() {
  const items = [
    ["New offer on Ethereal Flow", "$4,800", "4h ago"],
    ["Auction ending soon", "Silent Thoughts auction", "10m ago"],
    ["Your artwork sold", "Golden Balance", "1h ago"],
    ["New follower", "ArtCollector_82", "2h ago"],
    ["Certificate expiring soon", "Renew certificate", "1d ago"],
  ];
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Notifications" />
      <p className="px-5 text-xs font-semibold text-muted-foreground">Today</p>
      <div className="px-5 mt-3 space-y-3">
        {items.map(([t, d, ti], i) => (
          <div
            key={i}
            className="flex items-start gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{t}</p>
              <p className="text-xs text-muted-foreground">{d}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{ti}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
