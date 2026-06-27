import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton, SecondaryButton } from "@/components/art-ui";
import {
  createOrder,
  getWalletAddress,
  startFlutterwaveCheckout,
  submitCryptoPayment,
  type Order,
} from "@/lib/api";

export const Route = createFileRoute("/checkout")({
  validateSearch: (search) => ({
    artworkId: typeof search.artworkId === "string" ? search.artworkId : "",
    affiliateCode: typeof search.affiliateCode === "string" ? search.affiliateCode : "",
  }),
  component: Checkout,
});

function Checkout() {
  const { artworkId, affiliateCode } = Route.useSearch();
  const [method, setMethod] = useState<"flutterwave" | "wallet">("flutterwave");
  const [order, setOrder] = useState<Order | null>(null);
  const [txSignature, setTxSignature] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const startOrder = async () => {
    if (!artworkId || isBusy) return;
    setIsBusy(true);
    setStatus("");
    try {
      const created = await createOrder({
        artworkId,
        paymentProvider: method === "wallet" ? "wallet" : "flutterwave",
        affiliateCode: affiliateCode || window.localStorage.getItem("collectibles.affiliateCode") || undefined,
      });
      setOrder(created.order);
      if (method === "flutterwave") {
        const checkout = await startFlutterwaveCheckout(created.order.id);
        window.location.href = checkout.checkoutUrl;
        return;
      }
      setStatus("Order created. Submit your wallet transaction signature after transfer.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not start checkout.");
    } finally {
      setIsBusy(false);
    }
  };

  const submitCrypto = async () => {
    const walletAddress = getWalletAddress();
    if (!order || !walletAddress || !txSignature.trim() || isBusy) return;
    setIsBusy(true);
    setStatus("");
    try {
      const updated = await submitCryptoPayment(order.id, walletAddress, txSignature.trim());
      setOrder(updated.order);
      setStatus("Wallet payment submitted for review.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not submit wallet payment.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Checkout" />
      <div className="px-5">
        {!artworkId && (
          <p className="rounded-2xl bg-secondary p-4 text-sm text-muted-foreground">
            Choose an artwork before checking out.
          </p>
        )}
        {artworkId && (
          <>
            <div className="flex items-center gap-3 rounded-2xl bg-secondary p-3">
              <div className="w-14 h-14 rounded-xl overflow-hidden">
                <BlobArt variant={0} className="w-full h-full" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Artwork order</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{artworkId}</p>
              </div>
            </div>

            <h2 className="font-semibold mt-6 mb-3">Payment Method</h2>
            <div className="space-y-2">
              <PaymentOption
                label="Flutterwave Checkout"
                active={method === "flutterwave"}
                onClick={() => setMethod("flutterwave")}
              />
              <PaymentOption
                label="Wallet / Crypto MVP"
                active={method === "wallet"}
                onClick={() => setMethod("wallet")}
              />
            </div>

            {order && (
              <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm">
                <p className="text-muted-foreground">Order</p>
                <p className="font-semibold">{order.payment_reference ?? order.id}</p>
                <p className="mt-2 text-muted-foreground">Status</p>
                <p className="font-semibold capitalize">{order.status.replace(/_/g, " ")}</p>
              </div>
            )}

            {method === "wallet" && order && (
              <div className="mt-4 rounded-2xl bg-secondary px-4 py-3">
                <p className="text-[11px] text-muted-foreground">Transaction signature</p>
                <input
                  value={txSignature}
                  onChange={(event) => setTxSignature(event.target.value)}
                  placeholder="Paste wallet transaction signature"
                  className="w-full bg-transparent outline-none text-sm font-medium"
                />
                <button
                  onClick={submitCrypto}
                  className="mt-3 w-full py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
                >
                  Submit Signature
                </button>
              </div>
            )}

            {status && (
              <p className="mt-4 text-sm text-muted-foreground" role="status">
                {status}
              </p>
            )}
          </>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        {artworkId ? (
          <PrimaryButton onClick={startOrder} className={isBusy ? "opacity-60" : ""}>
            {isBusy
              ? "Working..."
              : method === "flutterwave"
                ? "Pay with Flutterwave"
                : "Create Wallet Order"}
          </PrimaryButton>
        ) : (
          <SecondaryButton to="/explore">Browse Artworks</SecondaryButton>
        )}
        <Link to="/wallet" className="block text-center text-xs text-muted-foreground mt-2">
          Wallet payments must match the connected wallet.
        </Link>
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
