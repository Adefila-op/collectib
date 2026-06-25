import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/shipping")({
  component: Shipping,
});

function Shipping() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Shipping Address" />
      <div className="px-5 space-y-3">
        {[
          ["Full name", "Tima Bouzid"],
          ["Address line", "12 Marina Road"],
          ["City", "Lagos"],
          ["State", "Lagos"],
          ["Postal code", "100242"],
          ["Country", "Nigeria"],
          ["Phone", "+234 800 000 0000"],
        ].map(([l, v]) => (
          <div key={l} className="rounded-2xl bg-secondary px-4 py-3">
            <p className="text-[11px] text-muted-foreground">{l}</p>
            <input
              defaultValue={v}
              className="w-full bg-transparent outline-none text-sm font-medium"
            />
          </div>
        ))}
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton>Save Address</PrimaryButton>
      </div>
    </div>
  );
}
