import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard, Chip } from "@/components/art-ui";

export const Route = createFileRoute("/saved")({
  component: Saved,
});

function Saved() {
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Saved items</h1>
        <p className="mt-1 text-sm text-muted-foreground">Watchlist and favorites in one place</p>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        <Chip active>All saved</Chip>
        <Link
          to="/watchlist"
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
        >
          Watchlist
        </Link>
        <Link
          to="/favorites"
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
        >
          Favorites
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {["Ethereal Flow", "Golden Balance", "Echoes of Time", "Rhythm of Life"].map((title, i) => (
          <ArtworkCard
            key={title}
            id={String(i + 1)}
            title={title}
            artist={["Emma R.", "Luca M.", "Kwame A.", "Amina D."][i]}
            price={`$${(2500 + i * 700).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </MobileShell>
  );
}
