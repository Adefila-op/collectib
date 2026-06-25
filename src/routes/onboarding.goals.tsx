import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Chip, PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/onboarding/goals")({
  component: Goals,
});

const GOALS = [
  "Short-term gains",
  "Long-term growth",
  "Diversify portfolio",
  "Support emerging artists",
];

function Goals() {
  const [sel, setSel] = useState("Long-term growth");
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-6 flex-1">
        <h1 className="text-3xl font-extrabold leading-tight">
          What are your
          <br />
          investment goals?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">Choose your primary goal</p>
        <div className="flex flex-col gap-3 mt-8">
          {GOALS.map((g) => (
            <Chip key={g} active={sel === g} onClick={() => setSel(g)}>
              {g}
            </Chip>
          ))}
        </div>
      </div>
      <div className="p-6">
        <PrimaryButton to="/onboarding/setup">Next</PrimaryButton>
      </div>
    </div>
  );
}
