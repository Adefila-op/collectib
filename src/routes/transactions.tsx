import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { getOrders, Order } from "@/lib/api";

export const Route = createFileRoute("/transactions")({
  component: Transactions,
});

function Transactions() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [status, setStatus] = useState("Loading transactions...");

  useEffect(() => {
    let cancelled = false;
    getOrders()
      .then(({ orders }) => {
        if (cancelled) return;
        setOrders(orders);
        setStatus(orders.length ? "" : "No transactions yet.");
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Could not load transactions.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const items = useMemo(
    () =>
      orders.map((order) => ({
        id: order.id,
        kind: order.status === "paid" || order.status === "completed" ? "Purchase" : "Order",
        title: order.artworks?.title ?? "Marketplace artwork",
        value: formatMoney(order.amount, order.currency),
        date: order.created_at ? formatDate(order.created_at) : "Pending",
      })),
    [orders],
  );

  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Transactions</h1>
      </div>
      <div className="px-5 mt-4 space-y-2">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {items.map((item) => (
          <div
            key={item.id}
            className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-sm">{item.kind}</p>
              <p className="text-xs text-muted-foreground">
                {item.title} - {item.date}
              </p>
            </div>
            <p className="font-bold text-sm text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}

function formatMoney(amount: number | string, currency: string) {
  const value = Number(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency}`;
  if (currency === "USD") {
    return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(value);
  }
  return `${value.toLocaleString()} ${currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(
    new Date(value),
  );
}
