import { createFileRoute, useRouter } from "@tanstack/react-router";
import { BlobArt, PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/auction/$id")({
  component: Auction,
});

function Auction() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-28">
      <div className="flex items-center px-5 py-3">
        <button
          onClick={() => router.history.back()}
          className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center"
        >
          ←
        </button>
        <h1 className="ml-3 font-semibold">Live Auction</h1>
      </div>

      <div className="mx-5 rounded-3xl overflow-hidden aspect-square">
        <BlobArt variant={0} className="w-full h-full" />
      </div>

      <div className="px-5 mt-5">
        <h2 className="text-2xl font-extrabold">Ethereal Flow</h2>
        <p className="text-sm text-white/60 mt-1">by Emma Reyes</p>

        <div className="mt-5 rounded-2xl bg-white/5 p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60">Current Bid</p>
            <p className="text-2xl font-extrabold mt-1">$5,200</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60">Time Left</p>
            <p className="text-lg font-bold mt-1">12:34:56</p>
          </div>
        </div>

        <h3 className="font-semibold mt-6 mb-3">Bid History</h3>
        <div className="space-y-2">
          {[
            ["@art_lover_82", "$5,200", "2m ago"],
            ["@fine_collector", "$5,000", "5m ago"],
            ["@modern_art", "$4,800", "8m ago"],
          ].map(([u, b, t]) => (
            <div
              key={u}
              className="flex items-center justify-between text-sm rounded-xl bg-white/5 px-4 py-3"
            >
              <span>{u}</span>
              <span className="font-bold">{b}</span>
              <span className="text-white/40 text-xs">{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-[#0A0A0A] border-t border-white/10 p-4">
        <PrimaryButton>Place Bid</PrimaryButton>
      </div>
    </div>
  );
}
