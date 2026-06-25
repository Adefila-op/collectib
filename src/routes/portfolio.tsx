import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { ArtworkCard } from "@/components/art-ui";

export const Route = createFileRoute("/portfolio")({
  component: Portfolio,
});

function Portfolio() {
  return (
    <MobileShell>
      <div className="px-5 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">My Portfolio</h1>
        <Link to="/sell" className="text-sm text-primary font-semibold">
          Sell
        </Link>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Overview</p>

      <div className="mx-5 mt-4 rounded-3xl bg-primary text-primary-foreground p-5">
        <p className="text-xs opacity-80">Portfolio Value</p>
        <p className="text-3xl font-extrabold mt-1">
          $25,867.40 <span className="text-sm font-medium opacity-80">+18.6%</span>
        </p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <Stat label="Total Artworks" value="12" />
          <Stat label="Total Spent" value="$18,450" />
          <Stat label="Total Return" value="$7,417" />
        </div>
      </div>

      <div className="px-5 mt-6 flex items-center justify-between">
        <h2 className="font-semibold">Performance</h2>
        <div className="flex gap-1 text-xs">
          {["1D", "1W", "1M", "3M", "1Y", "All"].map((p, i) => (
            <button
              key={p}
              className={`px-2 py-1 rounded-full ${i === 3 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
      <Chart />

      <div className="px-5 mt-6 flex items-center justify-between">
        <Link to="/portfolio/analytics" className="text-xs text-primary font-semibold">
          Analytics →
        </Link>
      </div>

      <div className="px-5 mt-4 flex items-center justify-between">
        <h2 className="font-semibold">My Artworks</h2>
        <div className="flex items-center gap-3">
          <Link to="/upload" className="text-xs font-semibold text-muted-foreground">
            + Upload
          </Link>
          <Link to="/portfolio/artworks" className="text-xs text-primary font-semibold">
            View all
          </Link>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 px-5 mt-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ArtworkCard
            key={i}
            id={String(i + 1)}
            title={["Ethereal Flow", "Golden Balance", "Silent Thoughts", "Bloom Within"][i]}
            artist={["Emma Reyes", "Luca Moretti", "Zara Karim", "Tima B."][i]}
            price={`$${(3000 + i * 500).toLocaleString()}`}
            variant={i}
          />
        ))}
      </div>
    </MobileShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/15 p-2">
      <p className="text-[10px] opacity-80">{label}</p>
      <p className="font-bold text-sm mt-0.5">{value}</p>
    </div>
  );
}

function Chart() {
  return (
    <div className="mx-5 mt-3 h-36 rounded-2xl bg-secondary p-3">
      <svg viewBox="0 0 300 120" className="w-full h-full">
        <defs>
          <linearGradient id="cg" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#8B5CF6" stopOpacity="0.4" />
            <stop offset="1" stopColor="#8B5CF6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0 90 L30 80 L60 95 L90 70 L120 75 L150 50 L180 60 L210 40 L240 45 L270 25 L300 30 L300 120 L0 120 Z"
          fill="url(#cg)"
        />
        <path
          d="M0 90 L30 80 L60 95 L90 70 L120 75 L150 50 L180 60 L210 40 L240 45 L270 25 L300 30"
          stroke="#8B5CF6"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
