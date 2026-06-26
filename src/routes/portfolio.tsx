import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";
import { getPortfolio, type Artwork, type PortfolioSummary } from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
});

function Portfolio() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [status, setStatus] = useState("Loading portfolio...");

  useEffect(() => {
    getPortfolio()
      .then((response) => {
        setPortfolio(response);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load portfolio.");
      });
  }, []);

  const returnValue = portfolio?.stats.totalReturn ?? 0;
  const returnPrefix = returnValue >= 0 ? "+" : "";
  const chartPoints = useMemo(() => buildChartPoints(portfolio?.artworks ?? []), [portfolio]);

  return (
    <MobileShell>
      <div className="px-5 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">My Portfolio</h1>
        <Link to="/sell" className="text-sm text-primary font-semibold">
          Sell
        </Link>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Overview</p>

      <div className="mx-5 mt-4 rounded-3xl bg-primary text-primary-foreground p-5">
        <p className="text-xs opacity-80">Portfolio Value</p>
        <p className="text-3xl font-extrabold mt-1">
          {formatLocalPrice(portfolio?.stats.portfolioValue ?? 0, "USD")}{" "}
          <span className="text-sm font-medium opacity-80">
            {returnPrefix}
            {formatLocalPrice(returnValue, "USD")}
          </span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Total Artworks" value={String(portfolio?.stats.totalArtworks ?? 0)} />
          <Stat label="Total Spent" value={formatLocalPrice(portfolio?.stats.totalSpent ?? 0, "USD")} />
          <Stat label="Total Return" value={`${returnPrefix}${formatLocalPrice(returnValue, "USD")}`} />
        </div>
      </div>

      <div className="px-5 mt-6 flex items-center justify-between">
        <h2 className="font-semibold">Performance</h2>
        <div className="flex gap-1 text-xs">
          {["1D", "1W", "1M", "3M", "1Y", "All"].map((p, i) => (
            <button
              key={p}
              className={`px-2 py-1 rounded-full ${i === 3 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <Chart points={chartPoints} />

      <div className="px-5 mt-6 flex items-center justify-between">
        <Link to="/portfolio/analytics" className="text-xs text-primary font-semibold">
          Analytics →
        </Link>
      </div>

      <div className="px-5 mt-4 flex items-center justify-between">
        <h2 className="font-semibold">My Artworks</h2>
        <div className="flex items-center gap-3">
          <Link to="/upload" className="text-xs font-semibold text-muted-foreground">
            + Upload
          </Link>
          <Link to="/portfolio/artworks" className="text-xs text-primary font-semibold">
            View all
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-3">
        {status && <p className="col-span-2 text-sm text-muted-foreground">{status}</p>}
        {!status && (portfolio?.artworks.length ?? 0) === 0 && (
          <p className="col-span-2 text-sm text-muted-foreground">
            No portfolio artworks yet. Bought artworks and your listings will appear here.
          </p>
        )}
        {(portfolio?.artworks ?? []).slice(0, 4).map((artwork, i) => (
          <ArtworkCard
            key={artwork.id}
            id={artwork.id}
            title={artwork.title}
            artist={artwork.artists?.name ?? "Independent artist"}
            price={formatLocalPrice(artwork.price_amount, artwork.price_currency)}
            imageUrl={artwork.image_url}
            assetStatus={artwork.status}
            variant={i}
          />
        ))}
      </div>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-2">
      <p className="text-[10px] opacity-80">{label}</p>
      <p className="font-bold text-sm mt-0.5">{value}</p>
    </div>
  );
}

function Chart({ points }: { points: string }) {
  return (
    <div className="mx-5 mt-3 h-36 rounded-2xl bg-secondary p-3">
      <svg viewBox="0 0 300 120" className="w-full h-full">
        <defs>
          <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d={`${points} L300 120 L0 120 Z`}
          fill="url(#cg)"
        />
        <path
          d={points}
          stroke="#8B5CF6"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

function buildChartPoints(artworks: Artwork[]) {
  if (!artworks.length) return "M0 90 L60 90 L120 90 L180 90 L240 90 L300 90";

  const values = artworks.slice(0, 6).map((artwork) => Number(artwork.price_amount ?? 0));
  const max = Math.max(...values, 1);
  const step = 300 / Math.max(values.length - 1, 1);
  return values
    .map((value, index) => {
      const x = Math.round(index * step);
      const y = Math.round(105 - (value / max) * 80);
      return `${index === 0 ? "M" : "L"}${x} ${y}`;
    })
    .join(" ");
}
