import { createFileRoute, Link } from "@tanstack/react-router";
import { MobileShell } from "@/components/mobile-shell";

export const Route = createFileRoute("/inbox")({
  component: Inbox,
});

function Inbox() {
  const items = [
    ["Emma Reyes", "Yes, it is! Would you like to make an offer?", "2m", true],
    ["Luca Moretti", "Thanks for your interest!", "1h", false],
    ["Zara Karim", "I just listed a new piece.", "4h", false],
    ["Kwame Asante", "Shipping has been arranged.", "1d", false],
    ["Amina Diallo", "Welcome to my studio.", "3d", false],
  ];
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Inbox</h1>
      </div>
      <div className="px-5 mt-4 space-y-2">
        {items.map(([n, m, t, unread], i) => (
          <Link
            key={i}
            to="/messages"
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-12 h-12 rounded-full bg-accent shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between">
                <p className="font-semibold text-sm">{n as string}</p>
                <span className="text-[10px] text-muted-foreground">{t as string}</span>
              </div>
              <p className="text-xs text-muted-foreground truncate">{m as string}</p>
            </div>
            {unread && <div className="w-2 h-2 rounded-full bg-primary" />}
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}
