import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Chip, PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/onboarding/styles")({
  component: Styles,
});

const STYLES = [
  "Abstract",
  "Contemporary",
  "Photography",
  "Sculpture",
  "Painting",
  "Pop art",
  "Illustration",
  "Digital",
  "Surrealism",
];

function Styles() {
  const [sel, setSel] = useState<string[]>(["Abstract", "Photography", "Painting"]);
  const toggle = (s: string) =>
    setSel((p) => (p.includes(s) ? p.filter((x) => x !== s) : [...p, s]));
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-6 flex-1">
        <h1 className="text-3xl font-extrabold leading-tight">What art do you love?</h1>
        <p className="text-muted-foreground text-sm mt-2">Select your favorite art styles</p>
        <div className="flex flex-wrap gap-2 mt-8">
          {STYLES.map((s) => (
            <Chip key={s} active={sel.includes(s)} onClick={() => toggle(s)}>
              {s}
            </Chip>
          ))}
        </div>
      </div>
      <div className="p-6">
        <PrimaryButton to="/onboarding/budget">Next</PrimaryButton>
      </div>
    </div>
  );
}
