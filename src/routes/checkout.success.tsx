import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { SecondaryButton } from "@/components/art-ui";
import { verifyFlutterwaveCheckout } from "@/lib/api";
import { Check } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  validateSearch: (search) => ({
    txRef: typeof search.tx_ref === "string" ? search.tx_ref : "",
    transactionId: typeof search.transaction_id === "string" ? search.transaction_id : "",
    status: typeof search.status === "string" ? search.status : "",
  }),
  component: Success,
});

function Success() {
  const { txRef, transactionId, status: paymentStatus } = Route.useSearch();
  const [status, setStatus] = useState("Confirming payment...");
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    if (!txRef) {
      setStatus("Payment returned. Your order will update after Flutterwave confirmation.");
      return;
    }

    verifyFlutterwaveCheckout({ txRef, transactionId })
      .then((response) => {
        setOrderId(response.order.id);
        setStatus(
          response.verified
            ? "Payment confirmed. Your order is marked paid."
            : "Payment is pending confirmation. We will update the order shortly.",
        );
      })
      .catch((error) => {
        setStatus(
          error instanceof Error
            ? error.message
            : "Could not confirm payment yet. We will keep checking through the webhook.",
        );
      });
  }, [paymentStatus, transactionId, txRef]);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="w-20 h-20 rounded-full bg-success flex items-center justify-center text-white">
          <Check size={36} />
        </div>
        <h1 className="text-2xl font-extrabold mt-6">Congratulations!</h1>
        <p className="text-muted-foreground text-sm mt-2 max-w-xs">
          {status}
        </p>
        {txRef && <p className="text-xs text-muted-foreground mt-5">Reference: {txRef}</p>}
        {orderId && <p className="text-xs text-muted-foreground mt-1">Order ID: {orderId}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          You will receive an email confirmation shortly.
        </p>
      </div>
      <div className="p-6">
        <SecondaryButton to="/transactions">View Order</SecondaryButton>
      </div>
    </div>
  );
}
