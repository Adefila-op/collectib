import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton } from "@/components/art-ui";
import { createOffer, getArtwork, type Artwork } from "@/lib/api";

export const Route = createFileRoute("/make-offer/$id")({
  component: MakeOffer,
});

function MakeOffer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("Loading artwork...");
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    getArtwork(id)
      .then((response) => {
        setArtwork(response.artwork);
        setAmount(Math.max(1, Math.round(Number(response.artwork.price_amount ?? 1) * 0.9)));
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load artwork.");
      });
  }, [id]);

  const sendOffer = async () => {
    if (!artwork || isBusy) return;
    setIsBusy(true);
    setStatus("");
    try {
      await createOffer({
        artworkId: artwork.id,
        amount,
        currency: artwork.price_currency,
        message: message.trim() || undefined,
      });
      navigate({ to: "/offers" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send offer.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Make an Offer" />
      <div className="px-5">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {artwork && (
          <>
            <div className="rounded-2xl bg-secondary p-3 flex items-center gap-3">
              <div className="w-14 h-14 rounded-xl bg-accent overflow-hidden">
                {artwork.image_url ? (
                  <img src={artwork.image_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <BlobArt variant={1} className="w-full h-full" />
                )}
              </div>
              <div>
                <p className="font-semibold text-sm">{artwork.title}</p>
                <p className="text-xs text-muted-foreground">
                  List price {formatMoney(artwork.price_amount, artwork.price_currency)}
                </p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl bg-primary-softer p-5 text-center">
              <p className="text-xs text-muted-foreground">Your offer</p>
              <p className="text-4xl font-extrabold text-primary mt-2">
                {formatMoney(amount, artwork.price_currency)}
              </p>
              <input
                type="range"
                value={amount}
                min={1}
                max={Math.max(2, Math.round(Number(artwork.price_amount) * 1.5))}
                onChange={(event) => setAmount(Number(event.target.value))}
                className="w-full accent-primary mt-4"
              />
            </div>
            <div className="mt-4 rounded-2xl bg-secondary px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Message (optional)</p>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="Add a note for the seller..."
                className="w-full bg-transparent outline-none text-sm font-medium resize-none"
              />
            </div>
          </>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton onClick={sendOffer} className={!artwork || isBusy ? "opacity-60" : ""}>
          {isBusy ? "Sending..." : "Send Offer"}
        </PrimaryButton>
      </div>
    </div>
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
