import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Artist, getArtists } from "@/lib/api";

export const Route = createFileRoute("/artists")({
  component: Artists,
});

function Artists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [status, setStatus] = useState("Loading featured artists...");

  useEffect(() => {
    let cancelled = false;
    getArtists()
      .then(({ artists }) => {
        if (cancelled) return;
        setArtists(artists);
        setStatus(artists.length ? "" : "No featured artists have been created by admin yet.");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load artists.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Artists</h1>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Admin-created real asset collections</p>
      <div className="px-5 mt-4 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {artists.map((artist, index) => (
          <Link
            key={artist.id}
            to="/artist/$id"
            params={{ id: artist.id }}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <ArtistMark index={index} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{artist.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {artist.location ?? "Featured artist"} - {artist.ownedCount} owned assets
              </p>
            </div>
            <span className="text-xs px-3 py-1.5 rounded-full bg-primary-softer text-primary font-semibold">
              Offer only
            </span>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}

function ArtistMark({ index }: { index: number }) {
  const colors = ["#EDE7FF", "#FFE9DC", "#E8F4EA", "#F7E6EF"];
  return (
    <div className="w-14 h-14 rounded-full overflow-hidden bg-accent shrink-0">
      <svg viewBox="0 0 56 56" className="w-full h-full">
        <rect width="56" height="56" fill={colors[index % colors.length]} />
        <circle cx="28" cy="22" r="11" fill="#1A1A1A" opacity="0.88" />
        <path d="M10 54 C16 35 40 35 46 54" fill="#1A1A1A" opacity="0.88" />
        <circle cx={18 + index * 3} cy="13" r="5" fill="#F5A524" opacity="0.85" />
      </svg>
    </div>
  );
}
