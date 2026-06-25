import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/transactions")({
  component: Transactions,
});

function Transactions() {
  const items = [
    ["Purchase", "Ethereal Flow", "-$4,250.00", "May 24"],
    ["Sale", "Golden Balance", "+$3,800.00", "May 18"],
    ["Bid", "Silent Thoughts", "-$2,900.00", "May 12"],
    ["Refund", "Bloom Within", "+$1,200.00", "May 02"],
    ["Deposit", "ETH", "+$2,400.00", "Apr 28"],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Transactions</h1>
      </div>
      <div className="px-5 mt-4 space-y-2">
        {items.map(([k, t, v, d], i) => (
          <div
            key={i}
            className="rounded-2xl bg-surface border border-border p-4 flex items-center justify-between"
          >
            <div>
              <p className="font-semibold text-sm">{k}</p>
              <p className="text-xs text-muted-foreground">
                {t} · {d}
              </p>
            </div>
            <p
              className={`font-bold text-sm ${v.startsWith("+") ? "text-success" : "text-foreground"}`}
            >
              {v}
            </p>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
