import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_PROMO_BANNER,
  getAdminPromoBanner,
  getAdminSummary,
  updateAdminPromoBanner,
  type Order,
  type PromoBanner,
} from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type AdminSummary = Awaited<ReturnType<typeof getAdminSummary>>;

function Admin() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [promoBanner, setPromoBanner] = useState<PromoBanner>(DEFAULT_PROMO_BANNER);
  const [status, setStatus] = useState("Loading admin data...");
  const [promoStatus, setPromoStatus] = useState("Loading promo banner...");
  const [isSavingPromo, setIsSavingPromo] = useState(false);

  useEffect(() => {
    getAdminSummary()
      .then((response) => {
        setSummary(response);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load admin data.");
      });

    getAdminPromoBanner()
      .then((response) => {
        setPromoBanner(response.banner);
        setPromoStatus("");
      })
      .catch((error) => {
        setPromoStatus(error instanceof Error ? error.message : "Could not load promo banner.");
      });
  }, []);

  const handlePromoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingPromo) return;

    setIsSavingPromo(true);
    setPromoStatus("");

    try {
      const response = await updateAdminPromoBanner(promoBanner);
      setPromoBanner(response.banner);
      setPromoStatus("Promo banner saved.");
    } catch (error) {
      setPromoStatus(error instanceof Error ? error.message : "Could not save promo banner.");
    } finally {
      setIsSavingPromo(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-10">
      <div className="px-5 pt-3 text-xs font-semibold">Admin</div>
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-xl font-extrabold">Operations</h1>
        <span className="text-xs text-white/60">Live data</span>
      </div>
      {status && <p className="px-5 text-sm text-white/60">{status}</p>}
      <form onSubmit={handlePromoSubmit} className="mx-5 mt-3 rounded-2xl bg-white/5 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Home Promo Banner</h2>
          <button
            type="submit"
            disabled={isSavingPromo}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-black disabled:opacity-60"
          >
            {isSavingPromo ? "Saving..." : "Save"}
          </button>
        </div>
        {promoStatus && <p className="mt-2 text-xs text-white/60">{promoStatus}</p>}
        <div className="mt-4 grid gap-3">
          <AdminField
            label="Greeting"
            value={promoBanner.greeting}
            onChange={(greeting) => setPromoBanner((current) => ({ ...current, greeting }))}
          />
          <AdminField
            label="Offer text"
            value={promoBanner.message}
            onChange={(message) => setPromoBanner((current) => ({ ...current, message }))}
          />
          <AdminField
            label="CTA label"
            value={promoBanner.ctaLabel}
            onChange={(ctaLabel) => setPromoBanner((current) => ({ ...current, ctaLabel }))}
          />
          <AdminField
            label="Details title"
            value={promoBanner.detailsTitle}
            onChange={(detailsTitle) =>
              setPromoBanner((current) => ({ ...current, detailsTitle }))
            }
          />
          <AdminField
            label="Details body"
            value={promoBanner.detailsBody}
            onChange={(detailsBody) => setPromoBanner((current) => ({ ...current, detailsBody }))}
            multiline
          />
        </div>
      </form>
      {summary && (
        <>
          <div className="grid grid-cols-2 gap-3 px-5 mt-3">
            <Stat label="Revenue" value={formatMoney(summary.stats.revenue ?? 0)} />
            <Stat label="Orders" value={String(summary.stats.orders ?? 0)} />
            <Stat label="Listed" value={String(summary.stats.listedArtworks ?? 0)} />
            <Stat label="Active Offers" value={String(summary.stats.activeOffers ?? 0)} />
            <Stat label="Webhooks" value={String(summary.stats.webhookEvents ?? 0)} />
            <Stat label="Artworks" value={String(summary.stats.artworks ?? 0)} />
          </div>

          <h2 className="px-5 mt-6 text-sm font-semibold">Recent Orders</h2>
          <div className="mx-5 mt-3 rounded-2xl bg-white/5 divide-y divide-white/10">
            {summary.recentOrders.map((order) => (
              <OrderRow key={order.id} order={order} />
            ))}
            {summary.recentOrders.length === 0 && (
              <p className="p-3 text-sm text-white/60">No orders yet.</p>
            )}
          </div>

          <h2 className="px-5 mt-6 text-sm font-semibold">Webhook Events</h2>
          <div className="mx-5 mt-3 rounded-2xl bg-white/5 divide-y divide-white/10">
            {summary.recentWebhooks.map((event) => (
              <div key={event.id} className="p-3">
                <p className="text-sm font-semibold">{event.provider}</p>
                <p className="text-xs text-white/60">
                  {event.event_type}
                  {event.external_id ? ` / ${event.external_id}` : ""}
                </p>
              </div>
            ))}
            {summary.recentWebhooks.length === 0 && (
              <p className="p-3 text-sm text-white/60">No webhook events yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-1 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-sm text-white outline-none focus:border-white/40"
        />
      )}
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <p className="text-[10px] text-white/60">{label}</p>
      <p className="text-lg font-bold mt-1">{value}</p>
    </div>
  );
}

function OrderRow({ order }: { order: Order }) {
  return (
    <div className="flex items-center justify-between p-3 gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold truncate">{order.artworks?.title ?? order.id}</p>
        <p className="text-xs text-white/60 capitalize">
          {order.payment_provider} / {order.status.replace(/_/g, " ")}
        </p>
      </div>
      <span className="text-sm font-semibold">{formatMoney(order.amount, order.currency)}</span>
    </div>
  );
}

function formatMoney(amount: number | string, currency = "USD") {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount}`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency === "USDC" || currency === "SOL" ? "USD" : currency,
    maximumFractionDigits: 2,
  }).format(value);
}
