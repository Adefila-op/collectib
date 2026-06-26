import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell, TopBar } from "@/components/mobile-shell";
import { DEFAULT_PROMO_BANNER, getHomePromoBanner, type PromoBanner } from "@/lib/api";

export const Route = createFileRoute("/free-delivery")({
  component: FreeDelivery,
});

function FreeDelivery() {
  const [promoBanner, setPromoBanner] = useState<PromoBanner>(DEFAULT_PROMO_BANNER);

  useEffect(() => {
    getHomePromoBanner()
      .then((response) => setPromoBanner(response.banner))
      .catch(() => setPromoBanner(DEFAULT_PROMO_BANNER));
  }, []);

  return (
    <MobileShell bottomNav={false}>
      <TopBar title="Delivery Offer" />
      <div className="px-5 pb-10">
        <div className="relative overflow-hidden rounded-3xl bg-[#FFF0C9] p-5">
          <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full border-[20px] border-[#17B869]" />
          <div className="absolute -right-5 bottom-4 h-20 w-20 rounded-full border-[18px] border-[#18A9C7]" />
          <div className="relative z-10 max-w-[14rem]">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#9A7438]">Promo</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight text-foreground">
              {promoBanner.detailsTitle}
            </h1>
            <p className="mt-3 text-sm leading-6 text-foreground/70">{promoBanner.detailsBody}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-border bg-surface p-4">
          <p className="text-sm font-semibold">How it works</p>
          <div className="mt-3 space-y-3 text-sm text-muted-foreground">
            <p>Add eligible marketplace items to your order.</p>
            <p>Reach the offer threshold shown in the promo banner.</p>
            <p>Free delivery is applied at checkout before payment.</p>
          </div>
        </div>

        <Link
          to="/explore"
          className="mt-6 block rounded-2xl bg-primary px-5 py-4 text-center text-sm font-semibold text-primary-foreground active:scale-[0.98] transition"
        >
          Browse eligible artwork
        </Link>
      </div>
    </MobileShell>
  );
}
