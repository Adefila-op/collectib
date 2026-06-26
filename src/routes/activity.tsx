import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Chip } from "@/components/art-ui";
import { getActivity, type ActivityItem } from "@/lib/api";

export const Route = createFileRoute("/activity")({
  component: Activity,
});

function Activity() {
  const [tab, setTab] = useState("All");
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [status, setStatus] = useState("Loading activity...");

  useEffect(() => {
    getActivity()
      .then((response) => {
        setItems(response.activities);
        setStatus(response.activities.length ? "" : "No activity yet.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load activity.");
      });
  }, []);

  const visibleItems = useMemo(
    () =>
      items.filter((item) => {
        if (tab === "Offers") return item.type === "offer";
        if (tab === "Sales") return item.type === "order";
        return true;
      }),
    [items, tab],
  );

  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Activity</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {["All", "Offers", "Sales"].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-5 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {!status && visibleItems.length === 0 && (
          <p className="text-sm text-muted-foreground">No {tab.toLowerCase()} activity.</p>
        )}
        {visibleItems.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-12 h-12 rounded-xl bg-accent shrink-0 overflow-hidden">
              {item.imageUrl && <img src={item.imageUrl} alt="" className="h-full w-full object-cover" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{item.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.subject} · {item.value}
              </p>
            </div>
            <span className="text-[10px] text-muted-foreground shrink-0">{item.time}</span>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
