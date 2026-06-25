import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/artists")({
  component: Artists,
});

function Artists() {
  const list = [
    ["Emma Reyes", "Lagos, Nigeria", "28 works"],
    ["Luca Moretti", "Milan, Italy", "42 works"],
    ["Zara Karim", "Dakar, Senegal", "15 works"],
    ["Kwame Asante", "Accra, Ghana", "31 works"],
    ["Amina Diallo", "Paris, France", "22 works"],
    ["Tunde Adebayo", "Lagos, Nigeria", "18 works"],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Artists</h1>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Featured Today</p>
      <div className="px-5 mt-4 space-y-3">
        {list.map(([n, loc, w], i) => (
          <Link
            key={i}
            to="/artist/$id"
            params={{ id: String(i + 1) }}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-14 h-14 rounded-full bg-accent" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{n}</p>
              <p className="text-xs text-muted-foreground">
                {loc} · {w}
              </p>
            </div>
            <button className="text-xs px-3 py-1.5 rounded-full bg-primary text-primary-foreground font-semibold">
              Follow
            </button>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
