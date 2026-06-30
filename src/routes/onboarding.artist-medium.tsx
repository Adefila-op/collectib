import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { getOnboardingDraft, patchOnboardingDraft } from "@/lib/api";

export const Route = createFileRoute("/onboarding/artist-medium")({
  component: ArtistMedium,
});

const MEDIUM_GROUPS = [
  {
    label: "Traditional",
    items: [
      { name: "Oil & Acrylic", emoji: "🎨" },
      { name: "Watercolour", emoji: "💧" },
      { name: "Drawing & Ink", emoji: "✏️" },
      { name: "Printmaking", emoji: "🖨️" },
      { name: "Pastel", emoji: "🌸" },
    ],
  },
  {
    label: "Sculpture & Objects",
    items: [
      { name: "Sculpture", emoji: "🗿" },
      { name: "Ceramics", emoji: "🏺" },
      { name: "Jewellery", emoji: "💎" },
      { name: "Glass Art", emoji: "🔮" },
      { name: "Textile & Fiber", emoji: "🧵" },
    ],
  },
  {
    label: "Lens & Screen",
    items: [
      { name: "Photography", emoji: "📷" },
      { name: "Video & Film", emoji: "🎬" },
      { name: "Digital Art", emoji: "💻" },
      { name: "Pixel Art", emoji: "👾" },
      { name: "Generative / AI", emoji: "🤖" },
    ],
  },
  {
    label: "Concept & Space",
    items: [
      { name: "Installation", emoji: "🏛️" },
      { name: "Performance", emoji: "🎭" },
      { name: "Mixed Media", emoji: "🌀" },
      { name: "NFT / Crypto Art", emoji: "⛓️" },
    ],
  },
];

function ArtistMedium() {
  const navigate = useNavigate();
  const draft = getOnboardingDraft();
  const [sel, setSel] = useState<string[]>(draft.artMedium ?? []);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const toggle = (name: string) =>
    setSel((p) => (p.includes(name) ? p.filter((x) => x !== name) : [...p, name]));

  const handleNext = () => {
    patchOnboardingDraft({ artMedium: sel });
    navigate({ to: "/onboarding/artist-pricing" });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-5 flex-1 overflow-y-auto pb-6">
        {/* Header */}
        <div
          className="transition-all duration-500"
          style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(12px)" }}
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Step 2 of 3 · Artist
            </span>
          </div>
          <h1 className="text-3xl font-extrabold leading-tight">
            What medium
            <br />
            <span className="text-primary">do you work in?</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
            Select all that apply — this helps buyers find your work.
          </p>
          {sel.length > 0 && (
            <span className="inline-block mt-3 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {sel.length} selected
            </span>
          )}
        </div>

        {/* Groups */}
        <div className="mt-7 space-y-7">
          {MEDIUM_GROUPS.map((group, gi) => (
            <div
              key={group.label}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.5s ease ${100 + gi * 60}ms, transform 0.5s ease ${100 + gi * 60}ms`,
              }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item, si) => {
                  const active = sel.includes(item.name);
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => toggle(item.name)}
                      className="transition-all duration-200 active:scale-95"
                      style={{
                        opacity: visible ? 1 : 0,
                        transitionDelay: `${160 + gi * 60 + si * 30}ms`,
                      }}
                    >
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all duration-200 ${
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_2px_12px_-2px_var(--primary)]"
                          : "bg-background text-foreground border-border hover:border-primary/40"
                      }`}>
                        {item.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="p-5 border-t border-border bg-background transition-all duration-500"
        style={{ opacity: visible ? 1 : 0, transitionDelay: "500ms" }}>
        <button
          type="button"
          onClick={handleNext}
          disabled={sel.length === 0}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base transition-all active:scale-[0.98] disabled:opacity-50"
          style={{ boxShadow: sel.length > 0 ? "0 4px 20px -4px var(--primary)" : "none" }}
        >
          {sel.length === 0 ? "Pick at least one medium" : "Next →"}
        </button>
      </div>
    </div>
  );
}
