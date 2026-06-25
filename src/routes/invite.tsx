import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/invite")({
  component: Invite,
});

function Invite() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Invite friends, earn rewards" />
      <div className="px-6 text-center">
        <div className="my-6">
          <svg viewBox="0 0 200 140" className="w-56 h-40 mx-auto">
            <ellipse cx="70" cy="100" rx="30" ry="36" fill="#C9BCF5" />
            <circle cx="70" cy="72" r="14" fill="#2D1B4E" />
            <ellipse cx="135" cy="100" rx="30" ry="36" fill="#8B7CC9" />
            <circle cx="135" cy="72" r="14" fill="#2D1B4E" />
          </svg>
        </div>
        <h1 className="text-xl font-extrabold">
          Get $50 credit for each friend who makes their first purchase.
        </h1>
        <div className="mt-6 rounded-2xl bg-secondary px-4 py-3 text-sm font-mono">
          collectibles.art/invite/tima
        </div>
        <PrimaryButton className="mt-4">Share Link</PrimaryButton>
      </div>
    </div>
  );
}
