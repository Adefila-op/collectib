import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { getAdminSummary, type Order } from "@/lib/api";

export const Route = createFileRoute("/admin")({
  component: Admin,
});

type AdminSummary = Awaited<ReturnType<typeof getAdminSummary>>;

function Admin() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [status, setStatus] = useState("Loading admin data...");

  useEffect(() => {
    getAdminSummary()
      .then((response) => {
        setSummary(response);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load admin data.");
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white pb-10">
      <div className="px-5 pt-3 text-xs font-semibold">Admin</div>
      <div className="flex items-center justify-between px-5 py-4">
        <h1 className="text-xl font-extrabold">Operations</h1>
        <span className="text-xs text-white/60">Live data</span>
      </div>
      {status && <p className="px-5 text-sm text-white/60">{status}</p>}
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
