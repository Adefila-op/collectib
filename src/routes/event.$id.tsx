import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/event/$id")({
  component: Event,
});

function Event() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Event Detail" />
      <div className="mx-5 h-44 rounded-3xl bg-accent" />
      <div className="px-5 mt-5">
        <h1 className="text-2xl font-extrabold">Lagos Art Week</h1>
        <p className="text-sm text-muted-foreground mt-1">Aug 12 – 18 · Eko Convention Centre</p>
        <p className="text-sm leading-relaxed mt-4 text-muted-foreground">
          A weeklong celebration of contemporary West African art with exhibitions, talks, and live
          studio visits.
        </p>
        <div className="mt-5 rounded-2xl bg-secondary p-4 text-sm space-y-2">
          {[
            ["Opening", "Aug 12, 6 PM"],
            ["Talks", "Aug 14, 2 PM"],
            ["Closing Gala", "Aug 18, 8 PM"],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton>RSVP</PrimaryButton>
      </div>
    </div>
  );
}
