import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard, PrimaryButton, SecondaryButton } from "@/components/art-ui";
import { Artist, getArtist } from "@/lib/api";

export const Route = createFileRoute("/artist/$id")({
  component: ArtistRoute,
});

function ArtistRoute() {
  const { id } = Route.useParams();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [status, setStatus] = useState("Loading artist...");

  useEffect(() => {
    let cancelled = false;
    getArtist(id)
      .then(({ artist }) => {
        if (cancelled) return;
        setArtist(artist);
        setStatus("");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load artist.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Artist Profile" />
      {status && <p className="px-5 text-sm text-muted-foreground">{status}</p>}
      {artist && (
        <>
          <div className="px-5 text-center">
            <div className="w-24 h-24 mx-auto rounded-full bg-accent overflow-hidden">
              <ArtistPortrait />
            </div>
            <h1 className="text-2xl font-extrabold mt-3">{artist.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {artist.practice ?? "Artist"} - {artist.location ?? "Featured collection"}
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <PrimaryButton className="max-w-[120px] !py-2.5">Follow</PrimaryButton>
              <SecondaryButton to="/inbox" className="max-w-[120px] !py-2.5">
                Message
              </SecondaryButton>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 px-5 mt-6 text-center">
            <Stat label="Owned Assets" value={String(artist.ownedCount)} />
            <Stat label="For Sale" value={String(artist.availableCount)} />
            <Stat label="Collection" value="Admin" />
          </div>

          <div className="px-5 mt-6">
            <h2 className="font-semibold mb-2">About</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{artist.bio}</p>
          </div>

          <div className="flex items-center justify-between px-5 mt-6">
            <h2 className="font-semibold">{artist.collectionTitle}</h2>
            <Link
              to="/artist/$id/artworks"
              params={{ id: artist.id }}
              className="text-xs text-primary font-semibold"
            >
              View Artworks
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5 mt-3">
            {artist.artworks.slice(0, 4).map((artwork, index) => (
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
        </>
      )}
    </div>
  );
}

function ArtistPortrait() {
  return (
    <svg viewBox="0 0 96 96" className="w-full h-full">
      <rect width="96" height="96" fill="#EDE7FF" />
      <circle cx="48" cy="38" r="18" fill="#1A1A1A" />
      <ellipse cx="48" cy="86" rx="34" ry="24" fill="#126B5A" />
      <circle cx="66" cy="24" r="10" fill="#F5A524" />
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary p-2">
      <p className="font-bold text-sm">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
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
