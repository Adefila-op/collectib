import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import type { FileRouteTypes } from "@/routeTree.gen";
import {
  Activity,
  Bell,
  Brush,
  ChevronRight,
  FolderHeart,
  HandCoins,
  HelpCircle,
  LogOut,
  Settings,
  ShieldCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  type ProfileItem = {
    label: string;
    Icon: LucideIcon;
    to: FileRouteTypes["to"];
    meta?: string;
    params?: Record<string, string>;
  };
  const groups: Array<{ label: string; items: ProfileItem[] }> = [
    {
      label: "Collecting",
      items: [
        { label: "Saved items", Icon: FolderHeart, to: "/saved", meta: "watchlist + favorites" },
        { label: "Bids & offers", Icon: HandCoins, to: "/offers" },
        { label: "Transactions", Icon: Activity, to: "/transactions" },
      ],
    },
    {
      label: "Holdings",
      items: [{ label: "Holdings", Icon: ShieldCheck, to: "/holdings", meta: "wallet + vault" }],
    },
    {
      label: "Artist",
      items: [
        { label: "My Artist Profile", Icon: Brush, to: "/artist/$id", params: { id: "1" } },
        { label: "Apply as Artist", Icon: UserPlus, to: "/apply-artist" },
      ],
    },
    {
      label: "Account",
      items: [
        { label: "Settings", Icon: Settings, to: "/settings" },
        { label: "Invite Friends", Icon: Bell, to: "/invite" },
        { label: "Help & Support", Icon: HelpCircle, to: "/help" },
      ],
    },
  ];

  return (
    <MobileShell>
      <div className="mx-5 mt-3 rounded-3xl bg-primary-softer p-5 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          TB
        </div>
        <div>
          <p className="font-bold">Tima Bouzid</p>
          <p className="text-xs text-foreground/60">tima@gmail.com</p>
        </div>
      </div>
      <div className="px-5 mt-5 space-y-5">
        {groups.map((group) => (
          <section key={group.label}>
            <h2 className="px-1 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              {group.label}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              {group.items.map(({ label, Icon, to, meta, params }) => (
                <Link
                  key={label}
                  to={to}
                  params={params}
                  className="flex items-center gap-3 border-b border-border px-3 py-3 last:border-b-0"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1 text-sm font-semibold">{label}</span>
                  {meta && <span className="text-[11px] text-muted-foreground">{meta}</span>}
                  <ChevronRight size={16} className="text-muted-foreground" />
                </Link>
              ))}
            </div>
          </section>
        ))}
        <Link
          to="/"
          className="flex items-center justify-center gap-2 rounded-2xl bg-destructive/10 px-3 py-3 text-sm font-bold text-destructive"
        >
          <LogOut size={17} />
          Log Out
        </Link>
      </div>
    </MobileShell>
  );
}
