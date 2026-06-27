import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Check } from "lucide-react";

export const Route = createFileRoute("/settings/currency")({
  component: CurrencySettings,
});

const currencies = [
  { code: "USD", label: "US Dollar", note: "Default marketplace display currency" },
  { code: "USDC", label: "USD Coin", note: "Useful for stablecoin settlement" },
  { code: "SOL", label: "Solana", note: "Useful for wallet-native pricing" },
];

function CurrencySettings() {
  const [selected, setSelected] = useState(() => localStorage.getItem("collectibles.currency") ?? "USD");

  const chooseCurrency = (currency: string) => {
    localStorage.setItem("collectibles.currency", currency);
    setSelected(currency);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Currency" />
      <div className="px-5 space-y-3">
        {currencies.map((currency) => (
          <button
            key={currency.code}
            onClick={() => chooseCurrency(currency.code)}
            className="flex w-full items-center justify-between rounded-2xl border border-border bg-surface p-4 text-left"
          >
            <span>
              <span className="block text-sm font-semibold">{currency.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{currency.note}</span>
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-primary">
              {selected === currency.code && <Check size={16} />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
