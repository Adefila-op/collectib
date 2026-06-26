import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";
import { Artwork, getArtworks } from "@/lib/api";

export const Route = createFileRoute("/trending")({
  component: Trending,
});

function Trending() {
  const [items, setItems] = useState<Artwork[]>([]);
  const [status, setStatus] = useState("Loading trending listings...");

  useEffect(() => {
    let cancelled = false;
    getArtworks("listed")
      .then(({ artworks }) => {
        if (cancelled) return;
        setItems(artworks);
        setStatus(artworks.length ? "" : "No trending listings yet.");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load listings.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Trending</h1>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Top active marketplace listings</p>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {status && <p className="col-span-2 text-sm text-muted-foreground">{status}</p>}
        {items.map((artwork, index) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            artist={artwork.artists?.name ?? "Collectibles artist"}
            price={formatMoney(artwork.price_amount, artwork.price_currency)}
            imageUrl={artwork.image_url}
            variant={index}
          />
        ))}
      </div>
    </MobileShell>
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
