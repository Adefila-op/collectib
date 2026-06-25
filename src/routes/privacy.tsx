import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Privacy Policy" />
      <div className="px-5 text-sm text-muted-foreground leading-relaxed space-y-4">
        <p>We respect your privacy. This policy explains what we collect and how it's used.</p>
        <h2 className="font-semibold text-foreground">Data we collect</h2>
        <p>Account info, transaction history, and wallet addresses you connect.</p>
        <h2 className="font-semibold text-foreground">How we use it</h2>
        <p>To process orders, verify provenance, and improve recommendations.</p>
        <h2 className="font-semibold text-foreground">Your rights</h2>
        <p>You can request, export, or delete your data at any time from Settings.</p>
      </div>
    </div>
  );
}
