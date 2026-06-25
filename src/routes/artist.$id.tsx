import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ArtworkCard, PrimaryButton, SecondaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/artist/$id")({
  component: Artist,
});

function Artist() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Artist Profile" />
      <div className="px-5 text-center">
        <div className="w-24 h-24 mx-auto rounded-full bg-accent overflow-hidden">
          <svg viewBox="0 0 96 96" className="w-full h-full">
            <rect width="96" height="96" fill="#C9BCF5" />
            <circle cx="48" cy="40" r="16" fill="#2D1B4E" />
            <ellipse cx="48" cy="85" rx="30" ry="20" fill="#2D1B4E" />
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold mt-3">Emma Reyes</h1>
        <p className="text-sm text-muted-foreground mt-1">Emerging Artist · Lagos, Nigeria</p>
        <div className="flex gap-2 justify-center mt-4">
          <PrimaryButton className="max-w-[120px] !py-2.5">Follow</PrimaryButton>
          <SecondaryButton to="/inbox" className="max-w-[120px] !py-2.5">
            Message
          </SecondaryButton>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 px-5 mt-6 text-center">
        {[
          ["Total Sales", "$245K"],
          ["Artworks Sold", "28"],
          ["Collectors", "156"],
          ["Avg Growth", "+42.5%"],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-secondary p-2">
            <p className="font-bold text-sm">{v}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{k}</p>
          </div>
        ))}
      </div>

      <div className="px-5 mt-6">
        <h2 className="font-semibold mb-2">About</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Emma Reyes is a contemporary artist based in Lagos, Nigeria. Her work explores the
          intersection of identity, memory, and abstraction.
        </p>
      </div>

      <div className="flex items-center justify-between px-5 mt-6">
        <h2 className="font-semibold">Artworks</h2>
        <Link
          to="/artist/$id/artworks"
          params={{ id: "1" }}
          className="text-xs text-primary font-semibold"
        >
          View Artworks ›
        </Link>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArtworkCard
            key={i}
            id={String(i + 1)}
            title={["Ethereal Flow", "Inner Peace", "Broken Lines", "Purple Haze"][i]}
            artist="Emma Reyes"
            price={`$${(2500 + i * 600).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </div>
  );
}
