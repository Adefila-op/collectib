import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard, Chip } from "@/components/art-ui";
import { getArtworks, type Artwork } from "@/lib/api";
import { Search } from "lucide-react";

export const Route = createFileRoute("/explore")({
  component: Explore,
});

const TABS = ["All", "USD", "USDC", "SOL"];
const DISCOVERY_LINKS = [
  { label: "Artists", to: "/artists" },
  { label: "Auctions", to: "/auctions" },
  { label: "Collections", to: "/collections" },
  { label: "Events", to: "/events" },
  { label: "Community", to: "/community" },
] as const;

function Explore() {
  const [tab, setTab] = useState("All");
  const [query, setQuery] = useState("");
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [status, setStatus] = useState("Loading artworks...");

  useEffect(() => {
    getArtworks()
      .then((response) => {
        setArtworks(response.artworks);
        setStatus(response.artworks.length ? "" : "No listed artworks yet.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load artworks.");
      });
  }, []);

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return artworks.filter((artwork) => {
      const matchesTab = tab === "All" || artwork.price_currency === tab;
      const matchesQuery =
        !normalizedQuery ||
        artwork.title.toLowerCase().includes(normalizedQuery) ||
        (artwork.artists?.name ?? "").toLowerCase().includes(normalizedQuery);
      return matchesTab && matchesQuery;
    });
  }, [artworks, query, tab]);

  return (
    <MobileShell>
      <div className="px-5 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Explore</h1>
      </div>
      <div className="mx-5 mt-3 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Search artworks or artists..."
        />
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 mt-4 pb-2">
        <Chip active>Artworks</Chip>
        {DISCOVERY_LINKS.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className="relative shrink-0 rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-foreground"
          >
            {item.label}
            <span className="ml-1.5 rounded-md bg-orange-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-orange-700">
              new
            </span>
          </Link>
        ))}
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 mt-1 pb-2">
        {TABS.map((t) => (
          <Chip key={t} active={t === tab} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-4 flex gap-2 overflow-x-auto no-scrollbar pb-1">
        <Link
          to="/sell/create"
          className="shrink-0 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium"
        >
          Create Listing
        </Link>
        <Link
          to="/offers"
          className="shrink-0 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium"
        >
          Offers
        </Link>
        <Link
          to="/wallet"
          className="shrink-0 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium"
        >
          Wallet Holdings
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {status && <p className="col-span-2 text-sm text-muted-foreground">{status}</p>}
        {!status && filtered.length === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground">No artworks match this search.</p>
        )}
        {filtered.map((artwork, i) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            artist={artwork.artists?.name ?? "Independent artist"}
            price={formatMoney(artwork.price_amount, artwork.price_currency)}
            variant={i}
            imageUrl={artwork.image_url}
          />
        ))}
      </div>
    </MobileShell>
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
