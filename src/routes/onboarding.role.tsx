import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { updateDashboardType, patchOnboardingDraft, clearOnboardingDraft } from "@/lib/api";

export const Route = createFileRoute("/onboarding/role")({
  component: RolePicker,
});

type Role = "collector" | "artist";

function RolePicker() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleContinue = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setError("");
    try {
      await updateDashboardType(selected);
    } catch {
      // non-fatal
    } finally {
      setIsSubmitting(false);
    }
    // Start a fresh draft with the chosen role
    clearOnboardingDraft();
    patchOnboardingDraft({ role: selected });
    navigate({ to: "/onboarding/styles" });
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden flex flex-col">
      <div className="relative z-10 flex flex-col flex-1 px-6 pt-14 pb-8 max-w-4xl mx-auto w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-surface px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Step 1 of 2
          </span>
        </div>

        <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight">
          How will you
          <br />
          <span className="text-primary">use Collectibles?</span>
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
          Pick your primary role. You can always explore both sides of the platform.
        </p>

        {/* Role cards */}
        <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <RoleCard
            role="collector"
            selected={selected === "collector"}
            onSelect={() => setSelected("collector")}
            icon={<CollectorIcon />}
            title="Collector"
            tagline="I discover & invest"
            perks={[
              "Curated artwork feed tailored to your taste",
              "Portfolio tracking & valuation tools",
              "Provenance certificates for every piece",
              "Exclusive collector-only drops",
            ]}
          />

          <RoleCard
            role="artist"
            selected={selected === "artist"}
            onSelect={() => setSelected("artist")}
            icon={<ArtistIcon />}
            title="Artist"
            tagline="I create & sell"
            perks={[
              "Sell original artworks on the marketplace",
              "Analytics on views, offers & earnings",
              "Artist profile & verified badge",
              "Direct buyer messaging & offer management",
            ]}
          />
        </div>

        {error && <p className="mt-4 text-xs text-center text-destructive">{error}</p>}

        {/* CTA */}
        <div className="mt-10 sm:mt-auto pt-8">
          <button
            id="onboarding-role-continue"
            type="button"
            onClick={handleContinue}
            disabled={isSubmitting || !selected}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all active:scale-[0.98] disabled:opacity-60 bg-primary text-primary-foreground"
            style={{
              boxShadow: selected ? "0 4px 20px -4px var(--primary)" : "none",
            }}
          >
            {isSubmitting
              ? "Setting up your account..."
              : selected
                ? `Continue as ${selected === "collector" ? "Collector" : "Artist"}`
                : "Select a role to continue"}
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  selected,
  onSelect,
  icon,
  title,
  tagline,
  perks,
}: {
  role: Role;
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  tagline: string;
  perks: string[];
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full text-left rounded-3xl p-6 transition-all duration-200 active:scale-[0.98] border-2 flex flex-col ${
        selected
          ? "bg-primary/5 border-primary shadow-[0_0_24px_-8px_var(--primary)]"
          : "bg-surface border-border hover:border-border/80"
      }`}
    >
      {/* Icon circle */}
      <div
        className={`flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
          selected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
        }`}
      >
        {icon}
      </div>

      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl font-extrabold text-foreground">{title}</span>
        {selected && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary text-primary-foreground">
            Selected
          </span>
        )}
      </div>
      <p className="text-sm text-muted-foreground font-medium mb-6">{tagline}</p>

      {/* Perks list */}
      <ul className="space-y-3 mt-auto">
        {perks.map((perk) => (
          <li key={perk} className="flex items-start gap-3 text-xs text-foreground/80 leading-relaxed">
            <span
              className={`flex-shrink-0 w-4 h-4 mt-0.5 rounded-full flex items-center justify-center text-[10px] ${
                selected ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
              }`}
            >
              ✓
            </span>
            {perk}
          </li>
        ))}
      </ul>
    </button>
  );
}

function CollectorIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 7L12 2L22 7V17L12 22L2 17V7Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M12 2V22M2 7L22 17M22 7L2 17"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
    </svg>
  );
}

function ArtistIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="3" fill="currentColor" />
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M12 2C14 6 14 10 12 12C10 14 6 14 2 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.45"
      />
      <path
        d="M12 2C10 6 10 10 12 12C14 14 18 14 22 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeOpacity="0.45"
      />
    </svg>
  );
}
