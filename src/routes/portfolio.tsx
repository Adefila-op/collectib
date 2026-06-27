import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";
import {
  getPortfolio,
  type Artwork,
  type PortfolioSummary,
  type ProvenanceCertificate,
  type WalletAssetSummary,
} from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";
import { shortWalletAddress } from "@/lib/solana-wallet";
import { ShieldCheck, WalletCards } from "lucide-react";

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
  const walletNfts = portfolio?.wallet.nfts ?? [];
  const certificates = portfolio?.provenanceCertificates ?? [];

  return (
    <MobileShell>
      <div className="px-5 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Portfolio</h1>
        <Link to="/onboarding/wallet" className="text-sm text-primary font-semibold">
          Connect
        </Link>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Wallet, artworks, and provenance</p>

      <div className="mx-5 mt-4 rounded-3xl bg-primary text-primary-foreground p-5">
        <p className="text-xs opacity-80">Total Portfolio Value</p>
        <p className="text-3xl font-extrabold mt-1">
          {formatLocalPrice(portfolio?.stats.portfolioValue ?? 0, "USD")}{" "}
          <span className="text-sm font-medium opacity-80">
            {returnPrefix}
            {formatLocalPrice(returnValue, "USD")}
          </span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="SOL" value={formatToken(portfolio?.stats.solBalance ?? 0, "SOL")} />
          <Stat label="USDC" value={formatToken(portfolio?.stats.usdcBalance ?? 0, "USDC")} />
          <Stat label="Certs" value={String(portfolio?.stats.provenanceCertificates ?? 0)} />
        </div>
      </div>

      <div className="mx-5 mt-4 grid grid-cols-2 gap-3">
        <MiniStat label="Artworks" value={String(portfolio?.stats.totalArtworks ?? 0)} />
        <MiniStat label="Total spent" value={formatLocalPrice(portfolio?.stats.totalSpent ?? 0, "USD")} />
        <MiniStat label="Wallet NFTs" value={String(portfolio?.stats.walletNfts ?? 0)} />
        <MiniStat label="Return" value={`${returnPrefix}${formatLocalPrice(returnValue, "USD")}`} />
      </div>

      <section className="px-5 mt-6">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Connected Wallets</h2>
          <Link to="/onboarding/wallet" className="text-xs text-primary font-semibold">
            Manage
          </Link>
        </div>
        <div className="mt-3 space-y-2">
          {(portfolio?.wallet.wallets ?? []).length === 0 && (
            <p className="rounded-2xl border border-border bg-surface p-4 text-sm text-muted-foreground">
              Connect a wallet to show SOL, USDC, NFTs, and provenance certificates here.
            </p>
          )}
          {(portfolio?.wallet.wallets ?? []).map((wallet) => (
            <div key={wallet.walletAddress} className="rounded-2xl border border-border bg-surface p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                  <WalletCards size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-semibold">{shortWalletAddress(wallet.walletAddress)}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {wallet.checkedAt ? `Updated ${new Date(wallet.checkedAt).toLocaleString()}` : "No live snapshot yet"}
                  </p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <MiniStat label="SOL" value={formatToken(wallet.solBalance, "SOL")} />
                <MiniStat label="USDC" value={formatToken(wallet.usdcBalance, "USDC")} />
                <MiniStat label="NFTs" value={String(wallet.nfts.length)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <AssetRail title="Non-Fungible Assets" nfts={walletNfts} certificates={certificates} />

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
          Analytics &gt;
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

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-3">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-bold">{value}</p>
    </div>
  );
}

function AssetRail({
  title,
  nfts,
  certificates,
}: {
  title: string;
  nfts: WalletAssetSummary[];
  certificates: ProvenanceCertificate[];
}) {
  const activeCertificates = certificates.filter((certificate) => certificate.status === "active");
  if (nfts.length === 0 && activeCertificates.length === 0) return null;

  return (
    <section className="mt-6">
      <div className="px-5 flex items-center justify-between">
        <h2 className="font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground">
          {nfts.length + activeCertificates.length} assets
        </span>
      </div>
      <div className="mt-3 flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
        {activeCertificates.map((certificate) => (
          <Link
            key={certificate.id}
            to="/provenance/$id"
            params={{ id: certificate.artwork_id }}
            className="w-44 shrink-0 rounded-2xl border border-primary/20 bg-primary-softer p-3"
          >
            <div className="flex h-20 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={26} />
            </div>
            <p className="mt-3 truncate text-sm font-bold">
              {certificate.artworks?.title ?? "Provenance certificate"}
            </p>
            <p className="mt-1 text-[11px] capitalize text-muted-foreground">
              {String(certificate.onchain_status ?? "pending_mint").replace(/_/g, " ")}
            </p>
          </Link>
        ))}
        {nfts.map((asset) => (
          <div key={asset.id} className="w-44 shrink-0 rounded-2xl border border-border bg-surface p-3">
            <div className="h-20 overflow-hidden rounded-xl bg-secondary">
              {asset.imageUrl ? (
                <img src={asset.imageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs font-bold text-muted-foreground">
                  {asset.symbol.slice(0, 4)}
                </div>
              )}
            </div>
            <p className="mt-3 truncate text-sm font-bold">{asset.name}</p>
            <p className="mt-1 truncate text-[11px] text-muted-foreground">{asset.symbol}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function formatToken(value: number, symbol: "SOL" | "USDC") {
  return `${value.toLocaleString(undefined, {
    maximumFractionDigits: symbol === "SOL" ? 4 : 2,
  })} ${symbol}`;
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
