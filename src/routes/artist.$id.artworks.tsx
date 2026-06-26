import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard, Chip } from "@/components/art-ui";
import { Artist, getArtist } from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";

export const Route = createFileRoute("/artist/$id/artworks")({
  component: ArtistArtworks,
});

function ArtistArtworks() {
  const { id } = Route.useParams();
  const [tab, setTab] = useState("All");
  const [artist, setArtist] = useState<Artist | null>(null);
  const [status, setStatus] = useState("Loading artworks...");

  useEffect(() => {
    let cancelled = false;
    getArtist(id)
      .then(({ artist }) => {
        if (cancelled) return;
        setArtist(artist);
        setStatus(artist.artworks.length ? "" : "No artworks in this collection yet.");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load artworks.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const artworks = useMemo(() => {
    if (!artist) return [];
    if (tab === "Owned") return artist.artworks.filter((artwork) => artwork.status === "owned");
    if (tab === "Listed") return artist.artworks.filter((artwork) => artwork.status === "listed");
    return artist.artworks;
  }, [artist, tab]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title={artist ? `${artist.name} Artworks` : "Artist Artworks"} />
      <div className="flex gap-2 px-5">
        {["All", "Owned", "Listed"].map((t) => (
          <Chip key={t} active={t === tab} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {status && <p className="col-span-2 text-sm text-muted-foreground">{status}</p>}
        {artworks.map((artwork, index) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            artist={artist?.name ?? "Featured artist"}
            price={formatLocalPrice(artwork.price_amount, artwork.price_currency)}
            imageUrl={artwork.image_url}
            assetStatus={artwork.status}
            variant={index}
          />
        ))}
      </div>
    </div>
  );
}
