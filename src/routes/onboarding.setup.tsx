import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar } from "@/components/mobile-shell";
import { getOnboardingDraft, saveOnboardingPrefs, clearOnboardingDraft } from "@/lib/api";
import { Image, BarChart2, Bell, Upload, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/onboarding/setup")({
  component: Setup,
});

function Setup() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 80);
    const t2 = setTimeout(() => setPulse(true), 600);

    const draft = getOnboardingDraft();
    saveOnboardingPrefs({
      artStyles:      draft.artStyles,
      budgetRange:    draft.budgetRange,
      investmentGoal: draft.investmentGoal,
      artMedium:      draft.artMedium,
      pricingRange:   draft.pricingRange,
    }).catch(() => {});

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleExplore = () => {
    setSaving(true);
    localStorage.setItem("onboarding_completed", "true");
    clearOnboardingDraft();
    navigate({ to: "/home" });
  };

  const role = getOnboardingDraft().role ?? "collector";

  const collectorFeatures = [
    { icon: <Image size={22} strokeWidth={1.5} />, label: "Curated Feed" },
    { icon: <BarChart2 size={22} strokeWidth={1.5} />, label: "Portfolio" },
    { icon: <Bell size={22} strokeWidth={1.5} />, label: "Live Drops" },
  ];
  const artistFeatures = [
    { icon: <Upload size={22} strokeWidth={1.5} />, label: "Upload Works" },
    { icon: <BarChart2 size={22} strokeWidth={1.5} />, label: "Analytics" },
    { icon: <MessageCircle size={22} strokeWidth={1.5} />, label: "Buyer Chat" },
  ];
  const features = role === "artist" ? artistFeatures : collectorFeatures;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Animated celebration ring */}
        <div
          className="transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "scale(1) translateY(0)" : "scale(0.85) translateY(20px)",
          }}
        >
          <div className="relative w-36 h-36 mx-auto mb-8">
            <div
              className="absolute inset-0 rounded-full border-2 border-primary/30 transition-all duration-1000"
              style={{ transform: pulse ? "scale(1.3)" : "scale(1)", opacity: pulse ? 0 : 0.6 }}
            />
            <div
              className="absolute inset-0 rounded-full border-2 border-primary/20 transition-all duration-1000"
              style={{ transform: pulse ? "scale(1.55)" : "scale(1)", opacity: pulse ? 0 : 0.35, transitionDelay: "150ms" }}
            />
            <div className="w-36 h-36 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center">
              {/* Checkmark SVG */}
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
                <circle cx="28" cy="28" r="28" fill="currentColor" className="text-primary/15" />
                <path
                  d="M16 28.5l8 8 16-16"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-primary"
                  style={{
                    strokeDasharray: 40,
                    strokeDashoffset: visible ? 0 : 40,
                    transition: "stroke-dashoffset 0.6s ease 0.4s",
                  }}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Text */}
        <div
          className="transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)", transitionDelay: "200ms" }}
        >
          <h1 className="text-3xl font-extrabold leading-tight">
            You're all set,
            <br />
            <span className="text-primary">welcome aboard!</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-3 leading-relaxed max-w-xs mx-auto">
            {role === "artist"
              ? "Your artist profile is ready. Start uploading your works and connect with collectors worldwide."
              : "Your personalised art world is ready. Discover artworks, track your collection, and connect with artists."}
          </p>
        </div>

        {/* Feature highlights */}
        <div
          className="mt-8 grid grid-cols-3 gap-3 w-full max-w-xs"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.5s ease 350ms, transform 0.5s ease 350ms",
          }}
        >
          {features.map((f) => (
            <div key={f.label} className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-secondary border border-border">
              <span className="text-primary">{f.icon}</span>
              <span className="text-[11px] font-semibold text-muted-foreground text-center leading-tight">{f.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div
        className="p-5 border-t border-border bg-background transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transitionDelay: "500ms" }}
      >
        <button
          type="button"
          onClick={handleExplore}
          disabled={saving}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98] disabled:opacity-70"
          style={{ boxShadow: "0 4px 20px -4px var(--primary)" }}
        >
          {saving ? "Setting up..." : "Explore Collectibles →"}
        </button>
      </div>
    </div>
  );
}
