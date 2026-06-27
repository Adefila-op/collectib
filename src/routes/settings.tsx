import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import type { FileRouteTypes } from "@/routeTree.gen";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/settings")({
  component: Settings,
});

type SettingsItem = [label: string, value: string | undefined, to: FileRouteTypes["to"]];

function Settings() {
  const account: SettingsItem[] = [
    ["Edit Profile", undefined, "/profile"],
    ["Change Password", undefined, "/settings/security"],
    ["Payment Methods", undefined, "/portfolio"],
  ];
  const prefs: SettingsItem[] = [
    ["Currency", "USD", "/settings/currency"],
    ["Notifications", undefined, "/notifications"],
    ["Provenance & Certificates", undefined, "/settings/provenance"],
    ["Returns & Refunds", undefined, "/shipping"],
  ];
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Settings" />
      <div className="px-5">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Account</p>
        <Group items={account} />
        <p className="text-xs font-semibold text-muted-foreground mb-2 mt-6">Preferences</p>
        <Group items={prefs} />
        <div className="mt-8 space-y-2">
          <Link to="/terms" className="block text-sm text-muted-foreground text-center">
            Terms of Service
          </Link>
          <Link to="/privacy" className="block text-sm text-muted-foreground text-center">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

function Group({ items }: { items: SettingsItem[] }) {
  return (
    <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
      {items.map(([label, val, to]) => (
        <Link key={label} to={to} className="flex items-center justify-between px-4 py-3">
          <span className="text-sm font-medium">{label}</span>
          <div className="flex items-center gap-2 text-muted-foreground">
            {val && <span className="text-xs">{val}</span>}
            <ChevronRight size={16} />
          </div>
        </Link>
      ))}
    </div>
  );
}
