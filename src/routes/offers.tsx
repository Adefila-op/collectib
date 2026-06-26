import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Chip } from "@/components/art-ui";
import { getOffers, getSessionProfileId, updateOfferStatus, type Offer } from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";

export const Route = createFileRoute("/offers")({
  component: Offers,
});

function Offers() {
  const [tab, setTab] = useState<"Received" | "Sent">("Received");
  const [offers, setOffers] = useState<Offer[]>([]);
  const [status, setStatus] = useState("Loading offers...");
  const profileId = getSessionProfileId();

  const loadOffers = () => {
    getOffers()
      .then((response) => {
        setOffers(response.offers);
        setStatus(response.offers.length ? "" : "No offers yet.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load offers.");
      });
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const visibleOffers = useMemo(
    () =>
      offers.filter((offer) =>
        tab === "Received"
          ? offer.seller_profile_id === profileId
          : offer.buyer_profile_id === profileId,
      ),
    [offers, profileId, tab],
  );

  const updateStatus = async (id: string, nextStatus: "accepted" | "rejected" | "withdrawn") => {
    setStatus("");
    try {
      await updateOfferStatus(id, nextStatus);
      loadOffers();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not update offer.");
    }
  };

  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Offers</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {(["Received", "Sent"] as const).map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-5 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {!status && visibleOffers.length === 0 && (
          <p className="text-sm text-muted-foreground">No {tab.toLowerCase()} offers.</p>
        )}
        {visibleOffers.map((offer) => (
          <div key={offer.id} className="rounded-2xl bg-surface border border-border p-4">
            <div className="flex justify-between items-start gap-3">
              <div>
                <p className="font-semibold text-sm">{offer.artworks?.title ?? "Artwork"}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {tab === "Received" ? "From buyer" : "Sent to seller"}
                </p>
              </div>
              <span className={statusClass(offer.status)}>{offer.status}</span>
            </div>
            <p className="mt-2 text-lg font-bold text-primary">
              {formatLocalPrice(offer.amount, offer.currency)}
            </p>
            {offer.message && <p className="mt-2 text-sm text-muted-foreground">{offer.message}</p>}
            {offer.status === "active" && tab === "Received" && (
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => updateStatus(offer.id, "accepted")}
                  className="flex-1 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  Accept
                </button>
                <button
                  onClick={() => updateStatus(offer.id, "rejected")}
                  className="flex-1 py-2 rounded-xl bg-secondary text-xs font-semibold"
                >
                  Reject
                </button>
              </div>
            )}
            {offer.status === "active" && tab === "Sent" && (
              <button
                onClick={() => updateStatus(offer.id, "withdrawn")}
                className="mt-3 w-full py-2 rounded-xl bg-secondary text-xs font-semibold"
              >
                Withdraw
              </button>
            )}
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

function statusClass(status: Offer["status"]) {
  const tone =
    status === "accepted"
      ? "bg-success/15 text-success"
      : status === "rejected" || status === "withdrawn" || status === "expired"
        ? "bg-destructive/15 text-destructive"
        : "bg-secondary text-muted-foreground";
  return `text-[10px] font-bold px-2 py-1 rounded-full capitalize ${tone}`;
}
