import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Chip, PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/onboarding/budget")({
  component: Budget,
});

const RANGES = ["Under $1,000", "$1,000 – $5,000", "$5,000 – $25,000", "$25,000+"];

function Budget() {
  const [sel, setSel] = useState("$1,000 – $5,000");
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-6 flex-1">
        <h1 className="text-3xl font-extrabold leading-tight">
          What's your
          <br />
          budget range?
        </h1>
        <p className="text-muted-foreground text-sm mt-2">Select your budget range</p>
        <div className="flex flex-col gap-3 mt-8">
          {RANGES.map((r) => (
            <Chip key={r} active={sel === r} onClick={() => setSel(r)}>
              {r}
            </Chip>
          ))}
        </div>
      </div>
      <div className="p-6">
        <PrimaryButton to="/onboarding/goals">Next</PrimaryButton>
      </div>
    </div>
  );
}
