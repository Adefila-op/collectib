import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { ChevronRight, KeyRound, Shield } from "lucide-react";

export const Route = createFileRoute("/settings/security")({
  component: SecuritySettings,
});

function SecuritySettings() {
  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Security" />
      <div className="px-5 space-y-3">
        <Link
          to="/forgot-password"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
            <KeyRound size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Change Password</span>
            <span className="mt-1 block text-xs text-muted-foreground">Send a secure reset link to your email.</span>
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
        <Link
          to="/two-factor"
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
            <Shield size={18} />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">Two-Factor Auth</span>
            <span className="mt-1 block text-xs text-muted-foreground">Add an authenticator code step.</span>
          </span>
          <ChevronRight size={16} className="text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}
