import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";
import { Artist, getArtist } from "@/lib/api";

export const Route = createFileRoute("/collection/$id")({
  component: Collection,
});

function Collection() {
  const { id } = Route.useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [status, setStatus] = useState("Loading collection...");

  useEffect(() => {
    let cancelled = false;
    getArtist(id)
      .then(({ artist }) => {
        if (cancelled) return;
        setArtist(artist);
        setStatus(artist.artworks.length ? "" : "No artworks in this collection yet.");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load collection.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Collection Detail" />
      <div className="mx-5 rounded-3xl overflow-hidden aspect-[5/3] bg-accent">
        <CollectionHero />
      </div>
      <div className="px-5 mt-5">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {artist && (
          <>
            <h1 className="text-2xl font-extrabold">{artist.collectionTitle}</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Owned by Collectibles Admin - {artist.name}
            </p>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
              Admin-created physical asset collection. These works are owned inventory and accept
              collector offers only.
            </p>
            <div className="mt-4 flex gap-2">
              <Link
                to="/artist/$id"
                params={{ id: artist.id }}
                className="rounded-full bg-primary text-primary-foreground px-4 py-2 text-xs font-bold"
              >
                Artist Page
              </Link>
              <Link
                to="/artist/$id/artworks"
                params={{ id: artist.id }}
                className="rounded-full bg-secondary px-4 py-2 text-xs font-bold"
              >
                All Artworks
              </Link>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              {artist.ownedCount} owned asset{artist.ownedCount === 1 ? "" : "s"}
            </p>
          </>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-5">
        {artist?.artworks.map((artwork, index) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            artist={artist.name}
            price={formatMoney(artwork.price_amount, artwork.price_currency)}
            imageUrl={artwork.image_url}
            assetStatus={artwork.status}
            variant={index}
          />
        ))}
      </div>
    </div>
  );
}

function CollectionHero() {
  return (
    <svg viewBox="0 0 300 180" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
      <rect width="300" height="180" fill="#EDE7FF" />
      <ellipse cx="96" cy="94" rx="58" ry="78" fill="#1A1A1A" opacity="0.9" />
      <circle cx="206" cy="64" r="36" fill="#F5A524" opacity="0.88" />
      <rect x="182" y="106" width="78" height="44" rx="12" fill="#126B5A" opacity="0.86" />
    </svg>
  );
}

function formatMoney(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  if (currency === "USD") {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  }
  return `${value.toLocaleString()} ${currency}`;
}
