import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/events")({
  component: Events,
});

function Events() {
  const items = [
    ["Lagos Art Week", "Aug 12 – 18", "Eko Convention Centre"],
    ["Emerging Voices", "Aug 22", "Studio 14, Marina"],
    ["Print Editions Fair", "Sep 03 – 05", "The Wing Gallery"],
    ["Sculpture in the Park", "Sep 15", "Freedom Park"],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Events</h1>
      </div>
      <div className="px-5 mt-4 space-y-3">
        {items.map(([t, d, loc], i) => (
          <Link
            key={i}
            to="/event/$id"
            params={{ id: String(i + 1) }}
            className="block rounded-2xl bg-surface border border-border overflow-hidden"
          >
            <div className="h-28 bg-accent" />
            <div className="p-3">
              <p className="font-semibold text-sm">{t}</p>
              <p className="text-xs text-muted-foreground">
                {d} · {loc}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
