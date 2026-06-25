import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";
import type { FileRouteTypes } from "@/routeTree.gen";
import {
  User,
  Briefcase,
  Eye,
  Activity,
  Lock,
  Settings,
  HelpCircle,
  LogOut,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  component: Profile,
});

function Profile() {
  type ProfileItem = [label: string, Icon: LucideIcon, to: FileRouteTypes["to"]];
  const items: ProfileItem[] = [
    ["My Artist Profile", User, "/artist/$id"],
    ["Portfolio", Briefcase, "/portfolio"],
    ["Watchlist", Eye, "/watchlist"],
    ["Favorites", Eye, "/favorites"],
    ["Activity", Activity, "/activity"],
    ["Bids", Activity, "/bids"],
    ["Offers", Activity, "/offers"],
    ["Transactions", Briefcase, "/transactions"],
    ["Wallet", Lock, "/wallet"],
    ["Vault", Lock, "/vault"],
    ["Invite Friends", User, "/invite"],
    ["Apply as Artist", User, "/apply-artist"],
    ["Settings", Settings, "/settings"],
    ["Help & Support", HelpCircle, "/help"],
    ["Log Out", LogOut, "/"],
  ];
  return (
    <MobileShell>
      <div className="mx-5 mt-3 rounded-3xl bg-primary-soft p-5 flex items-center gap-3">
        <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg">
          TB
        </div>
        <div>
          <p className="font-bold">Tima Bouzid</p>
          <p className="text-xs text-foreground/60">tima@gmail.com</p>
        </div>
      </div>
      <div className="px-5 mt-5 space-y-1">
        {items.map(([label, Icon, to]) => (
          <Link
            key={label}
            to={to}
            params={to === "/artist/$id" ? { id: "1" } : undefined}
            className="flex items-center gap-3 py-3 px-2 rounded-xl hover:bg-secondary"
          >
            <Icon size={18} className="text-muted-foreground" />
            <span className="text-sm font-medium">{label}</span>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
