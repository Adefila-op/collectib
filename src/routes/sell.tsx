import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton, SecondaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/sell")({
  component: Sell,
});

function Sell() {
  const [type, setType] = useState<"instant" | "auction">("instant");
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Sell Artwork" />
      <div className="px-5">
        <h2 className="font-semibold mb-3">Choose Sale Type</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setType("instant")}
            className={`rounded-2xl p-4 text-left border ${type === "instant" ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
          >
            <p className="font-semibold text-sm">Instant Sale</p>
            <p className="text-xs text-muted-foreground mt-1">Sell at a fixed price</p>
          </button>
          <button
            onClick={() => setType("auction")}
            className={`rounded-2xl p-4 text-left border ${type === "auction" ? "border-primary bg-primary/5" : "border-border bg-surface"}`}
          >
            <p className="font-semibold text-sm">Auction Sale</p>
            <p className="text-xs text-muted-foreground mt-1">Sell to highest bidder</p>
          </button>
        </div>

        <h2 className="font-semibold mt-6 mb-3">My Listings</h2>
        <div className="space-y-3">
          {[
            ["Golden Balance", "$3,800", "Active"],
            ["Silent Thoughts", "$2,900", "Active"],
          ].map(([t, p, s]) => (
            <div
              key={t}
              className="flex items-center justify-between rounded-2xl bg-surface border border-border p-4"
            >
              <div>
                <p className="font-semibold text-sm">{t}</p>
                <p className="text-xs text-muted-foreground">{p}</p>
              </div>
              <span className="text-xs font-semibold text-success">{s}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4 flex gap-3">
        <SecondaryButton to="/upload">Upload Art</SecondaryButton>
        <PrimaryButton to="/sell/create">Create Listing</PrimaryButton>
      </div>
    </div>
  );
}
