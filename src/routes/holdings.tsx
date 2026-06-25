import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import { Chip } from "@/components/art-ui";
import { ChevronRight, ShieldCheck, Wallet } from "lucide-react";

export const Route = createFileRoute("/holdings")({
  component: Holdings,
});

function Holdings() {
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Holdings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Wallet assets and vault custody</p>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        <Chip active>Overview</Chip>
        <Link
          to="/wallet"
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
        >
          Wallet
        </Link>
        <Link
          to="/vault"
          className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
        >
          Vault
        </Link>
      </div>
      <div className="px-5 mt-5 space-y-3">
        <HoldingTile
          to="/wallet"
          icon={<Wallet size={18} />}
          title="Connected wallet"
          subtitle="Balances, NFTs, and crypto payment identity"
        />
        <HoldingTile
          to="/vault"
          icon={<ShieldCheck size={18} />}
          title="Collection vault"
          subtitle="Stored, in-transit, and delivered artworks"
        />
      </div>
    </MobileShell>
  );
}

function HoldingTile({
  to,
  icon,
  title,
  subtitle,
}: {
  to: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
    >
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">{subtitle}</span>
      </span>
      <ChevronRight size={18} className="text-muted-foreground" />
    </Link>
  );
}
