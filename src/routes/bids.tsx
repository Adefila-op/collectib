import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { getOffers, Offer } from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";

export const Route = createFileRoute("/bids")({
  component: Bids,
});

function Bids() {
  const [items, setItems] = useState<Offer[]>([]);
  const [status, setStatus] = useState("Loading offers...");

  useEffect(() => {
    let cancelled = false;
    getOffers()
      .then(({ offers }) => {
        if (cancelled) return;
        setItems(offers);
        setStatus(offers.length ? "" : "No offers yet.");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load offers.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">My Bids</h1>
      </div>
      <div className="px-5 mt-4 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {items.map((offer) => (
          <div
            key={offer.id}
            className="rounded-2xl bg-surface border border-border p-4 flex items-center gap-3"
          >
            <div className="w-12 h-12 rounded-xl bg-accent" />
            <div className="flex-1">
              <p className="font-semibold text-sm">
                {offer.artworks?.title ?? "Marketplace artwork"}
              </p>
              <p className="text-xs text-muted-foreground">
                {offer.created_at ? formatDate(offer.created_at) : "Pending"}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold text-sm text-primary">
                {formatLocalPrice(offer.amount, offer.currency)}
              </p>
              <p
                className={`text-[10px] font-bold ${offer.status === "accepted" ? "text-success" : offer.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`}
              >
                {offer.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}
