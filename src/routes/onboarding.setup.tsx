import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton, SecondaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/onboarding/setup")({
  component: Setup,
});

function Setup() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-6 flex-1 text-center">
        <h1 className="text-3xl font-extrabold leading-tight">
          Setup your
          <br />
          portfolio
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Create your first collection to get started
        </p>
        <div className="flex justify-center my-12">
          <Blob />
        </div>
        <div className="space-y-3">
          <PrimaryButton to="/home">Create Collection</PrimaryButton>
          <SecondaryButton to="/home">Add Watchlist</SecondaryButton>
          <Link to="/home" className="block text-sm font-medium text-muted-foreground py-2">
            Skip for now
          </Link>
        </div>
      </div>
      <div className="text-center pb-6">
        <Link to="/home" className="text-xs text-muted-foreground">
          Skip
        </Link>
      </div>
    </div>
  );
}

function Blob() {
  return (
    <svg viewBox="0 0 200 200" className="w-44 h-44">
      <path
        d="M100 30 Q160 40 165 100 Q170 165 100 170 Q35 175 35 100 Q40 25 100 30 Z"
        fill="#C9BCF5"
      />
      <circle cx="80" cy="100" r="5" fill="#1A1A1A" />
      <circle cx="120" cy="100" r="5" fill="#1A1A1A" />
      <path
        d="M85 125 Q100 135 115 125"
        stroke="#1A1A1A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
