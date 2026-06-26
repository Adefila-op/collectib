import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard, SectionHeader } from "@/components/art-ui";
import {
  DEFAULT_PROMO_BANNER,
  getArtworks,
  getHomePromoBanner,
  getMe,
  type Artwork,
  type PromoBanner,
} from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";
import { Search, Bell } from "lucide-react";

export const Route = createFileRoute("/home")({
  component: Home,
});

function Home() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [promoBanner, setPromoBanner] = useState<PromoBanner>(DEFAULT_PROMO_BANNER);
  const [status, setStatus] = useState("Loading listings...");

  useEffect(() => {
    getArtworks()
      .then((response) => {
        setArtworks(response.artworks.slice(0, 6));
        setStatus(response.artworks.length ? "" : "No marketplace artworks yet.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load listings.");
      });

    getHomePromoBanner()
      .then((response) => setPromoBanner(response.banner))
      .catch(() => setPromoBanner(DEFAULT_PROMO_BANNER));

    getMe()
      .then(({ profile }) => {
        const name = (profile.display_name || profile.email || "").trim();
        if (!name) return;
        setPromoBanner((banner) => ({
          ...banner,
          greeting: `Hello ${name.split(/\s+/)[0]}.`,
        }));
      })
      .catch(() => undefined);
  }, []);

  return (
    <MobileShell>
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">collectibles</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Track holdings, offers, and orders</p>
        </div>
        <Link
          to="/notifications"
          className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center"
        >
          <Bell size={18} />
        </Link>
      </div>

      <Link
        to="/search"
        className="mx-5 flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3 mt-2"
      >
        <Search size={16} className="text-muted-foreground" />
        <span className="text-sm text-muted-foreground">
          Search artworks, artists, collections...
        </span>
      </Link>

      <Link
        to="/free-delivery"
        className="relative mx-5 mt-5 block min-h-[114px] overflow-hidden rounded-2xl bg-[#FFF0C9] px-4 py-4"
      >
        <div className="absolute -right-7 -top-7 h-20 w-20 rounded-full border-[18px] border-[#17B869]" />
        <div className="absolute -right-4 bottom-2 h-16 w-16 rounded-full border-[16px] border-[#18A9C7]" />
        <div className="absolute right-12 -top-3 h-12 w-12 rounded-full border-[12px] border-[#F4A51C]" />
        <div className="relative z-10 flex items-center gap-4">
          <div className="relative h-20 w-24 shrink-0">
            <div className="absolute bottom-2 left-0 h-9 w-16 rounded-lg bg-[#19A78E]" />
            <div className="absolute bottom-7 left-8 h-10 w-8 rotate-[-8deg] rounded-md bg-[#0A73A8]" />
            <div className="absolute bottom-2 left-14 h-7 w-10 rounded-md bg-[#F3A21A]" />
            <div className="absolute bottom-0 left-3 h-4 w-4 rounded-full bg-[#222]" />
            <div className="absolute bottom-0 left-16 h-4 w-4 rounded-full bg-[#222]" />
            <div className="absolute bottom-11 left-4 h-4 w-5 rounded-sm bg-[#F6C04D]" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-foreground">{promoBanner.greeting}</p>
            <p className="mt-1 text-xs font-medium text-foreground/65">{promoBanner.message}</p>
            <span className="mt-3 inline-flex rounded-full bg-[#F6A51D] px-4 py-2 text-xs font-bold text-white shadow-sm">
              {promoBanner.ctaLabel}
            </span>
          </div>
        </div>
      </Link>

      <div className="mt-7">
        <SectionHeader title="Trending Artworks" action="View all" to="/trending" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar px-5 pb-2">
          {status && <p className="text-sm text-muted-foreground px-1">{status}</p>}
          {artworks.map((artwork, i) => (
            <div key={artwork.id} className="w-40 shrink-0">
              <ArtworkCard
                id={artwork.id}
                title={artwork.title}
                artist={artwork.artists?.name ?? "Independent artist"}
                price={formatLocalPrice(artwork.price_amount, artwork.price_currency)}
                variant={i}
                imageUrl={artwork.image_url}
                assetStatus={artwork.status}
              />
            </div>
          ))}
        </div>
      </div>

    </MobileShell>
  );
}
