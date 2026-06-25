import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Terms of Service" />
      <div className="px-5 text-sm text-muted-foreground leading-relaxed space-y-4">
        <p>Welcome to Collectibles. By using our app you agree to these terms.</p>
        <h2 className="font-semibold text-foreground">1. Accounts</h2>
        <p>You must be at least 18 to create an account. Keep your credentials safe.</p>
        <h2 className="font-semibold text-foreground">2. Purchases</h2>
        <p>All sales are final unless a provenance dispute is raised within 14 days.</p>
        <h2 className="font-semibold text-foreground">3. Listings</h2>
        <p>Artists are responsible for the authenticity and condition of their listings.</p>
        <h2 className="font-semibold text-foreground">4. Wallets</h2>
        <p>Connected wallets are used only for verified payments and ownership signing.</p>
      </div>
    </div>
  );
}
