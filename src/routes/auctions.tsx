import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { BlobArt, Chip } from "@/components/art-ui";
import { Artwork, getArtworks } from "@/lib/api";

export const Route = createFileRoute("/auctions")({
  component: Auctions,
});

function Auctions() {
  const [tab, setTab] = useState("Live");
  const [items, setItems] = useState<Artwork[]>([]);
  const [status, setStatus] = useState("Loading marketplace listings...");

  useEffect(() => {
    let cancelled = false;
    getArtworks("listed")
      .then(({ artworks }) => {
        if (cancelled) return;
        setItems(artworks);
        setStatus(artworks.length ? "" : "No live listings yet.");
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
        <h1 className="text-2xl font-extrabold">Live Auctions</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {["Live", "Upcoming", "Ended"].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-5 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {items.map((artwork, index) => (
          <Link
            key={artwork.id}
            to="/auction/$id"
            params={{ id: artwork.id }}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-muted">
              {artwork.image_url ? (
                <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <BlobArt variant={index} className="w-full h-full" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{artwork.title}</p>
              <p className="text-xs text-muted-foreground truncate">
                by {artwork.artists?.name ?? "Collectibles artist"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 font-semibold">
                {tab} listing
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-muted-foreground">Price</p>
              <p className="font-bold text-sm text-primary">
                {formatMoney(artwork.price_amount, artwork.price_currency)}
              </p>
            </div>
          </Link>
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
