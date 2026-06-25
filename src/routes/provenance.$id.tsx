import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton } from "@/components/art-ui";
import { Check } from "lucide-react";

export const Route = createFileRoute("/provenance/$id")({
  component: Provenance,
});

function Provenance() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Provenance Certificate" />
      <div className="mx-5 rounded-3xl bg-secondary p-5">
        <div className="rounded-2xl overflow-hidden aspect-[4/3] bg-muted">
          <BlobArt variant={0} className="w-full h-full" />
        </div>
        <h2 className="font-bold text-lg mt-4">Ethereal Flow</h2>
        <p className="text-xs text-muted-foreground">by Emma Reyes · 2025</p>

        <div className="mt-4 space-y-2 text-sm">
          {[
            ["Certificate ID", "COL-2024-0821-001"],
            ["Owner", "Tima Bouzid"],
            ["Acquired", "May 24, 2024"],
            ["Medium", "Acrylic on Canvas"],
            ["Dimensions", "100 × 100 cm"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 rounded-xl bg-primary/10 text-primary px-3 py-2">
          <Check size={16} />
          <span className="text-xs font-semibold">Blockchain Verified</span>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton>View on Blockchain</PrimaryButton>
      </div>
    </div>
  );
}
