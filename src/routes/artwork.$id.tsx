import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton, SecondaryButton } from "@/components/art-ui";
import { getArtwork, type Artwork } from "@/lib/api";
import { Share2 } from "lucide-react";

export const Route = createFileRoute("/artwork/$id")({
  component: ArtworkRoute,
});

function ArtworkRoute() {
  const { id } = Route.useParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [status, setStatus] = useState("Loading artwork...");

  useEffect(() => {
    getArtwork(id)
      .then((response) => {
        setArtwork(response.artwork);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load artwork.");
      });
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-32">
      <StatusBar />
      <TopBar
        right={
          <button className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center">
            <Share2 size={16} />
          </button>
        }
      />
      {status && <p className="px-5 text-sm text-muted-foreground">{status}</p>}
      {artwork && (
        <>
          <div className="mx-5 rounded-3xl overflow-hidden aspect-square bg-muted">
            {artwork.image_url ? (
              <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <BlobArt variant={hashVariant(artwork.id)} className="w-full h-full" />
            )}
          </div>
          <div className="px-5 mt-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold">{artwork.title}</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  by{" "}
                  <span className="text-primary font-semibold">
                    {artwork.artists?.name ?? "Independent artist"}
                  </span>
                </p>
              </div>
              <span className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold capitalize">
                {artwork.status === "owned" ? "Owned asset" : artwork.status}
              </span>
            </div>

            <p className="text-3xl font-extrabold mt-5 text-primary">
              {formatMoney(artwork.price_amount, artwork.price_currency)}
            </p>

            <div className="mt-6 rounded-2xl bg-secondary p-4 space-y-2 text-sm">
              <Info label="Currency" value={artwork.price_currency} />
              <Info
                label="Asset type"
                value={artwork.status === "owned" ? "Admin-owned physical artwork" : "Marketplace listing"}
              />
              <Info label="Token mint" value={artwork.token_mint ?? "Not linked"} />
              <Info label="Metadata URI" value={artwork.metadata_uri ?? "Not linked"} />
              <Info label="Status" value={artwork.status === "owned" ? "Offer only" : artwork.status} />
            </div>

            {artwork.description && (
              <p className="mt-4 text-sm leading-6 text-muted-foreground">{artwork.description}</p>
            )}
          </div>

          <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4 flex gap-3">
            <SecondaryButton to="/make-offer/$id" params={{ id: artwork.id }}>
              Make Offer
            </SecondaryButton>
            {artwork.status === "owned" ? (
              <PrimaryButton to="/make-offer/$id" params={{ id: artwork.id }}>
                Offer Only
              </PrimaryButton>
            ) : (
              <PrimaryButton to="/checkout" search={{ artworkId: artwork.id }}>
                Buy Now
              </PrimaryButton>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold truncate">{value}</span>
    </div>
  );
}

function hashVariant(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
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
