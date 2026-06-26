import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton } from "@/components/art-ui";
import {
  createOffer,
  getArtwork,
  getWalletAddress,
  submitOfferWalletPayment,
  type Artwork,
  type Offer,
} from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";

export const Route = createFileRoute("/make-offer/$id")({
  component: MakeOffer,
});

function MakeOffer() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [amount, setAmount] = useState(0);
  const [message, setMessage] = useState("");
  const [method, setMethod] = useState<"flutterwave" | "wallet">("flutterwave");
  const [createdOffer, setCreatedOffer] = useState<Offer | null>(null);
  const [txSignature, setTxSignature] = useState("");
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
    if (!artwork || isBusy || createdOffer) return;
    setIsBusy(true);
    setStatus("");
    try {
      const response = await createOffer({
        artworkId: artwork.id,
        amount,
        currency: artwork.price_currency,
        paymentProvider: method,
        message: message.trim() || undefined,
      });
      setCreatedOffer(response.offer);
      if (method === "flutterwave" && response.checkoutUrl) {
        window.location.href = response.checkoutUrl;
        return;
      }
      setStatus("Offer created. Submit your wallet transaction signature to activate it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send offer.");
    } finally {
      setIsBusy(false);
    }
  };

  const submitWalletPayment = async () => {
    const walletAddress = getWalletAddress();
    if (!createdOffer || !walletAddress || !txSignature.trim() || isBusy) return;
    setIsBusy(true);
    setStatus("");
    try {
      await submitOfferWalletPayment(createdOffer.id, walletAddress, txSignature.trim());
      navigate({ to: "/offers" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not submit wallet payment.");
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
                  {artwork.status === "owned" ? "Owner guide value" : "List price"}{" "}
                  {formatLocalPrice(artwork.price_amount, artwork.price_currency)}
                </p>
              </div>
            </div>
            {artwork.status === "owned" && (
              <p className="mt-3 rounded-2xl bg-primary-softer p-3 text-xs font-medium text-primary">
                This is an admin-owned physical artwork. It is not available for direct checkout;
                submit an offer for owner review.
              </p>
            )}
            <div className="mt-6 rounded-3xl bg-primary-softer p-5 text-center">
              <p className="text-xs text-muted-foreground">Your offer</p>
              <p className="text-4xl font-extrabold text-primary mt-2">
                {formatLocalPrice(amount, artwork.price_currency)}
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
            <div className="mt-4 space-y-2">
              <PaymentOption
                label="Pay offer with Flutterwave"
                active={method === "flutterwave"}
                onClick={() => setMethod("flutterwave")}
              />
              <PaymentOption
                label="Pay offer through wallet"
                active={method === "wallet"}
                onClick={() => setMethod("wallet")}
              />
            </div>
            {method === "wallet" && createdOffer && (
              <div className="mt-4 rounded-2xl bg-secondary px-4 py-3">
                <p className="text-[11px] text-muted-foreground">Wallet transaction signature</p>
                <input
                  value={txSignature}
                  onChange={(event) => setTxSignature(event.target.value)}
                  placeholder="Paste payment transaction signature"
                  className="w-full bg-transparent outline-none text-sm font-medium"
                />
                <button
                  onClick={submitWalletPayment}
                  className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-semibold text-primary-foreground"
                >
                  Submit Wallet Payment
                </button>
              </div>
            )}
          </>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton onClick={sendOffer} className={!artwork || isBusy ? "opacity-60" : ""}>
          {isBusy
            ? "Working..."
            : method === "flutterwave"
              ? "Pay Offer with Flutterwave"
              : createdOffer
                ? "Awaiting Wallet Signature"
                : "Create Wallet Offer"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function PaymentOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between rounded-2xl border px-4 py-3 ${
        active ? "border-primary bg-primary-softer" : "border-border bg-surface"
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span
        className={`w-4 h-4 rounded-full border ${active ? "bg-primary border-primary" : "border-border"}`}
      />
    </button>
  );
}
