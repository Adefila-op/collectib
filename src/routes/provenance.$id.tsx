import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton } from "@/components/art-ui";
import { getArtwork, getPortfolio, type Artwork, type ProvenanceCertificate } from "@/lib/api";
import { Check } from "lucide-react";

export const Route = createFileRoute("/provenance/$id")({
  component: Provenance,
});

function Provenance() {
  const { id } = Route.useParams();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [certificate, setCertificate] = useState<ProvenanceCertificate | null>(null);
  const [status, setStatus] = useState("Loading certificate...");

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getArtwork(id),
      getPortfolio().catch(() => null),
    ])
      .then(([artworkResponse, portfolioResponse]) => {
        if (cancelled) return;
        setArtwork(artworkResponse.artwork);
        const activeCertificate = portfolioResponse?.provenanceCertificates.find(
          (item) => item.artwork_id === id && item.status === "active",
        );
        setCertificate(activeCertificate ?? null);
        setStatus("");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load certificate.");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Provenance Certificate" />
      {status && <p className="px-5 text-sm text-muted-foreground">{status}</p>}
      {artwork && (
        <>
          <div className="mx-5 rounded-3xl bg-secondary p-5">
            <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
              {artwork.image_url ? (
                <img src={artwork.image_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <BlobArt variant={hashVariant(artwork.id)} className="w-full h-full" />
              )}
            </div>
            <h2 className="font-bold text-lg mt-4">{artwork.title}</h2>
            <p className="text-xs text-muted-foreground">
              by {artwork.artists?.name ?? "Featured artist"}
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <Info
                label="Certificate ID"
                value={certificate ? `COL-${certificate.id.slice(0, 8).toUpperCase()}` : `COL-${artwork.id.slice(0, 8).toUpperCase()}`}
              />
              <Info label="Holder" value={certificate ? "Your verified profile" : "Pending holder verification"} />
              <Info label="Asset" value="Original physical artwork" />
              <Info
                label="Transfer mode"
                value={artwork.status === "owned" ? "Offer review only" : "Marketplace checkout"}
              />
              <Info
                label="On-chain status"
                value={String(certificate?.onchain_status ?? "pending_mint").replace(/_/g, " ")}
              />
              <Info label="Token mint" value={certificate?.certificate_mint ?? artwork.token_mint ?? "Pending mint"} />
              {certificate?.mint_signature && <Info label="Mint signature" value={certificate.mint_signature} />}
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-2">
              <Check size={16} />
              <span className="text-xs font-semibold">Provenance Certified</span>
            </div>
          </div>
          <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
            <PrimaryButton to="/make-offer/$id" params={{ id: artwork.id }}>
              Make Offer
            </PrimaryButton>
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
      <span className="font-semibold text-right">{value}</span>
    </div>
  );
}

function hashVariant(id: string) {
  return id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 6;
}
