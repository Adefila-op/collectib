import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ActivityItem, getActivity } from "@/lib/api";

export const Route = createFileRoute("/notifications")({
  component: Notifications,
});

function Notifications() {
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState("Loading notifications...");

  useEffect(() => {
    let cancelled = false;
    getActivity()
      .then(({ activities }) => {
        if (cancelled) return;
        setItems(activities);
        setStatus(activities.length ? "" : "No account notifications yet.");
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Could not load notifications.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Notifications" />
      <p className="px-5 text-xs font-semibold text-muted-foreground">Today</p>
      <div className="px-5 mt-3 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-2 h-2 rounded-full bg-primary mt-2" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.subject}</p>
            </div>
            <span className="text-[10px] text-muted-foreground">{item.time}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
