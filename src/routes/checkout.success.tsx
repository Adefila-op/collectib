import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { SecondaryButton } from "@/components/art-ui";
import { Check } from "lucide-react";

export const Route = createFileRoute("/checkout/success")({
  component: Success,
});

function Success() {
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
          Your artwork has been purchased successfully.
        </p>
        <div className="mt-6 rounded-2xl bg-secondary p-3 flex items-center gap-3 w-full max-w-xs">
          <div className="w-12 h-12 rounded-xl bg-accent" />
          <div className="text-left">
            <p className="font-semibold text-sm">Ethereal Flow</p>
            <p className="text-xs text-muted-foreground">by Emma Reyes</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-5">Order ID: COL-2024-0821</p>
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
