import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { getOnboardingDraft, patchOnboardingDraft } from "@/lib/api";
import { Sprout, TrendingUp, Landmark, Gem } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export const Route = createFileRoute("/onboarding/budget")({
  component: Budget,
});

const RANGES: { label: string; Icon: LucideIcon; desc: string }[] = [
  { label: "Under $1,000",      Icon: Sprout,    desc: "Just getting started" },
  { label: "$1,000 – $5,000",   Icon: TrendingUp, desc: "Growing collector" },
  { label: "$5,000 – $25,000",  Icon: Landmark,  desc: "Serious investor" },
  { label: "$25,000+",          Icon: Gem,       desc: "Art connoisseur" },
];

function Budget() {
  const navigate = useNavigate();
  const draft = getOnboardingDraft();
  const [sel, setSel] = useState(draft.budgetRange ?? "$1,000 – $5,000");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleNext = () => {
    patchOnboardingDraft({ budgetRange: sel });
    navigate({ to: "/onboarding/goals" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-5 flex-1">
        <div
          className="transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Step 2 of 3
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            What's your<br />
            <span className="text-primary">budget range?</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            We'll personalise your artwork recommendations accordingly.
          </p>
        </div>

        <div className="flex flex-col gap-3 mt-8">
          {RANGES.map(({ label, Icon, desc }, i) => {
            const active = sel === label;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setSel(label)}
                className="w-full text-left transition-all duration-200 active:scale-[0.98]"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? "translateY(0)" : "translateY(16px)",
                  transitionDelay: `${120 + i * 70}ms`,
                  transition: `opacity 0.45s ease ${120 + i * 70}ms, transform 0.45s ease ${120 + i * 70}ms`,
                }}
              >
                <div className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  active ? "bg-primary/5 border-primary shadow-[0_4px_20px_-6px_var(--primary)]" : "bg-background border-border hover:border-primary/30"
                }`}>
                  <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                    active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  }`}>
                    <Icon size={22} strokeWidth={1.5} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-bold text-base ${active ? "text-primary" : "text-foreground"}`}>{label}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
                    active ? "border-primary bg-primary" : "border-border bg-background"
                  }`}>
                    {active && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4l2.5 2.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-5 border-t border-border bg-background transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transitionDelay: "450ms" }}>
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98]"
          style={{ boxShadow: "0 4px 20px -4px var(--primary)" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
