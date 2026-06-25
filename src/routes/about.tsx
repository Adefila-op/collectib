import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";

export const Route = createFileRoute("/about")({
  component: About,
});

function About() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="About" />
      <div className="px-5">
        <h1 className="text-2xl font-extrabold">Collectibles is everyone's art portfolio.</h1>
        <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
          We help collectors discover, verify, and grow their art collection — from emerging studios
          to established names.
        </p>
        <div className="mt-6 grid grid-cols-3 gap-3 text-center">
          {[
            ["12K", "Artists"],
            ["48K", "Collectors"],
            ["$24M", "Volume"],
          ].map(([v, l]) => (
            <div key={l} className="rounded-2xl bg-secondary p-3">
              <p className="font-bold text-base">{v}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{l}</p>
            </div>
          ))}
        </div>
        <h2 className="font-semibold mt-6">Our mission</h2>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          To make contemporary art ownership transparent, secure, and accessible from any phone.
        </p>
      </div>
    </div>
  );
}
