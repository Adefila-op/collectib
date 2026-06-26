import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";
import { Image } from "lucide-react";

export const Route = createFileRoute("/upload")({
  component: Upload,
});

function Upload() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Upload Artwork" />
      <div className="px-5">
        <div className="rounded-3xl border-2 border-dashed border-border bg-secondary/40 h-52 flex flex-col items-center justify-center text-muted-foreground">
          <Image size={32} />
          <p className="text-sm mt-2 font-medium">Tap to upload image</p>
          <p className="text-[11px]">JPG or PNG, up to 7 MB</p>
        </div>
        <div className="mt-5 space-y-3">
          {[
            ["Title", "Ethereal Flow"],
            ["Medium", "Acrylic on canvas"],
            ["Dimensions", "100 × 100 cm"],
            ["Year", "2025"],
            ["Price (USD)", "4250"],
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
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton to="/sell/create">Create Listing</PrimaryButton>
      </div>
    </div>
  );
}
