import { createFileRoute } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/portfolio/analytics")({
  component: Analytics,
});

function Analytics() {
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Portfolio Analytics</h1>
      </div>

      <div className="mx-5 mt-4 rounded-2xl bg-secondary p-5">
        <p className="text-xs text-muted-foreground">Collection Value</p>
        <p className="text-2xl font-extrabold mt-1">
          $25,867.40 <span className="text-sm text-success font-semibold">+18.6%</span>
        </p>
        <div className="mt-4 h-32">
          <svg viewBox="0 0 300 120" className="w-full h-full">
            <path
              d="M0 100 L40 85 L80 92 L120 60 L160 70 L200 40 L240 50 L300 20"
              stroke="#8B5CF6"
              strokeWidth="2.5"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-2">
          {["1D", "1W", "1M", "3M", "1Y", "All"].map((p) => (
            <span key={p}>{p}</span>
          ))}
        </div>
      </div>

      <h2 className="px-5 mt-6 font-semibold">Artist Performance</h2>
      <div className="mx-5 mt-3 rounded-2xl bg-surface border border-border divide-y divide-border">
        {[
          ["Emma Reyes", "+42.0%"],
          ["Luca Moretti", "+28.7%"],
          ["Zara Karim", "+15.3%"],
        ].map(([n, p]) => (
          <div key={n} className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-accent" />
              <span className="font-medium text-sm">{n}</span>
            </div>
            <span className="text-success font-semibold text-sm">{p}</span>
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
