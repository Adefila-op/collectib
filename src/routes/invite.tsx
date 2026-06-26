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
      <TopBar title="Affiliate Network" />
      <div className="px-5">
        <div className="rounded-3xl bg-[#E8F4EA] p-5">
          <p className="text-sm font-semibold text-primary">Collectibles partners</p>
          <h1 className="mt-2 text-3xl font-extrabold leading-tight">
            Earn up to 200k annually
          </h1>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Join our affiliate network by introducing collectors, artists, galleries, and curators
            to Collectibles.
          </p>
        </div>

        <div className="mt-5 space-y-3">
          {[
            ["Refer collectors", "Share Collectibles with qualified buyers and art investors."],
            ["Introduce artists", "Bring verified artists and real asset collections to the platform."],
            ["Track rewards", "Affiliate activity is reviewed by admin before payout approval."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-2xl bg-secondary p-4">
              <p className="text-sm font-semibold">{title}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
            </div>
          ))}
        </div>

        <PrimaryButton className="mt-6">Join Affiliate Network</PrimaryButton>
      </div>
    </div>
  );
}
