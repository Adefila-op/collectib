import { Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Bell } from "lucide-react";
import type { ReactNode } from "react";

export function MobileShell({
  children,
  bottomNav = true,
}: {
  children: ReactNode;
  bottomNav?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <main className={`flex-1 ${bottomNav ? "pb-24" : "pb-6"}`}>{children}</main>
      {bottomNav && <BottomNav />}
    </div>
  );
}

export function StatusBar() {
  return (
    <div className="flex items-center justify-between px-6 pt-3 pb-1 text-xs font-semibold text-foreground/80">
      <span>9:41</span>
      <div className="flex items-center gap-1">
        <svg width="16" height="10" viewBox="0 0 16 10" fill="currentColor">
          <path d="M1 6h2v3H1zM5 4h2v5H5zM9 2h2v7H9zM13 0h2v9h-2z" />
        </svg>
        <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor">
          <path d="M7 1.5a8.5 8.5 0 016.4 2.9l-.9.8a7.2 7.2 0 00-11 0l-.9-.8A8.5 8.5 0 017 1.5zm0 3a5.5 5.5 0 014.2 1.9l-.9.8a4.2 4.2 0 00-6.6 0l-.9-.8A5.5 5.5 0 017 4.5zm0 3a2.5 2.5 0 011.9.8L7 10 5.1 8.3A2.5 2.5 0 017 7.5z" />
        </svg>
        <div className="ml-1 flex items-center gap-0.5">
          <div className="w-5 h-2.5 border border-current rounded-sm relative">
            <div className="absolute inset-0.5 bg-current rounded-[1px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TopBar({
  title,
  right,
  back = true,
  to,
}: {
  title?: string;
  right?: ReactNode;
  back?: boolean;
  to?: string;
}) {
  const router = useRouter();
  return (
    <div className="flex items-center justify-between px-5 py-3">
      {back ? (
        <button
          onClick={() => (to ? router.navigate({ to }) : router.history.back())}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
      ) : (
        <div className="w-9" />
      )}
      {title && <h1 className="font-semibold text-base">{title}</h1>}
      <div className="w-9 flex justify-end">{right}</div>
    </div>
  );
}

import { Home, Compass, Briefcase, User } from "lucide-react";

export function BottomNav() {
  const items = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/portfolio", label: "Portfolio", icon: Briefcase },
    { to: "/profile", label: "Profile", icon: User },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border px-2 pt-2 pb-5">
      <div className="flex justify-around">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="flex flex-col items-center gap-1 py-1 px-3 text-muted-foreground [&.active]:text-primary"
            activeOptions={{ exact: false }}
          >
            <it.icon size={20} />
            <span className="text-[10px] font-medium">{it.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function NotificationButton() {
  return (
    <Link
      to="/notifications"
      className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center"
    >
      <Bell size={18} />
    </Link>
  );
}
