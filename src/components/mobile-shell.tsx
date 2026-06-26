import { Link, useRouter } from "@tanstack/react-router";
import { Activity, ArrowLeft, Bell, Briefcase, Compass, Home, User } from "lucide-react";
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
  return null;
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

export function BottomNav() {
  const items = [
    { to: "/home", label: "Home", icon: Home },
    { to: "/explore", label: "Explore", icon: Compass },
    { to: "/activity", label: "Activity", icon: Activity, isNew: true },
    { to: "/portfolio", label: "Portfolio", icon: Briefcase },
    { to: "/profile", label: "Profile", icon: User },
  ];
  return (
    <nav className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border px-2 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
      <div className="flex justify-around">
        {items.map((it) => (
          <Link
            key={it.to}
            to={it.to}
            className="relative flex flex-col items-center gap-1 py-1 px-2 text-muted-foreground [&.active]:text-primary"
            activeOptions={{ exact: false }}
          >
            {it.isNew && (
              <span className="absolute right-4 top-0 h-1.5 w-1.5 rounded-full bg-orange-700" />
            )}
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
