import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard, SectionHeader } from "@/components/art-ui";
import { getArtworks, type Artwork } from "@/lib/api";
import { Search, Bell } from "lucide-react";

export const Route = createFileRoute("/home")({
  component: Home,
});

function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [status, setStatus] = useState("Loading listings...");

  useEffect(() => {
    getArtworks()
      .then((response) => {
        setArtworks(response.artworks.slice(0, 6));
        setStatus(response.artworks.length ? "" : "No listed artworks yet.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load listings.");
      });
  }, []);

  return (
    <MobileShell>
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">collectibles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track holdings, offers, and orders</p>
        </div>
        <Link
          to="/notifications"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <Bell size={18} />
        </Link>
      </div>

      <Link
        to="/search"
        className="mx-5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 mt-2"
      >
        <Search size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Search artworks, artists, collections...
        </span>
      </Link>

      <div className="mx-5 mt-5 rounded-3xl bg-primary text-primary-foreground p-5">
        <p className="text-xs opacity-80">Listed Artworks</p>
        <p className="text-3xl font-extrabold mt-1">{artworks.length}</p>
        <p className="text-xs mt-1 opacity-90">Connected to live marketplace data</p>
      </div>

      <div className="mt-7">
        <SectionHeader title="Trending Artworks" action="View all" to="/trending" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
          {status && <p className="text-sm text-muted-foreground px-1">{status}</p>}
          {artworks.map((artwork, i) => (
            <div key={artwork.id} className="w-40 shrink-0">
              <ArtworkCard
                id={artwork.id}
                title={artwork.title}
                artist={artwork.artists?.name ?? "Independent artist"}
                price={formatMoney(artwork.price_amount, artwork.price_currency)}
                variant={i}
                imageUrl={artwork.image_url}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <SectionHeader title="Marketplace Actions" />
        <div className="grid grid-cols-2 gap-3 px-5">
          <ActionTile to="/explore" title="Browse" subtitle="Find listed works" />
          <ActionTile to="/sell/create" title="List" subtitle="Create a sale listing" />
          <ActionTile to="/offers" title="Offers" subtitle="Review sent and received" />
          <ActionTile to="/wallet" title="Wallet" subtitle="Track holdings only" />
        </div>
      </div>
    </MobileShell>
  );
}

function ActionTile({ to, title, subtitle }: { to: string; title: string; subtitle: string }) {
  return (
    <Link to={to} className="rounded-2xl bg-surface border border-border p-4">
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </Link>
  );
}

function formatMoney(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  const rendered = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "USDC" || currency === "SOL" ? "USD" : currency,
    maximumFractionDigits: currency === "USD" ? 2 : 6,
  }).format(value);
  return currency === "USD" ? rendered : `${rendered} ${currency}`;
}
