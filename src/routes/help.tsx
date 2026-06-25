import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { Search, ChevronRight } from "lucide-react";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/help")({
  component: Help,
});

function Help() {
  const topics = [
    "How to buy artwork",
    "Payment & Billing",
    "Shipping & Delivery",
    "Provenance & Certificates",
    "Returns & Refunds",
  ];
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Help & Support" />
      <div className="px-5">
        <p className="text-sm font-medium mb-3">How can we help you?</p>
        <div className="flex items-center gap-2 rounded-2xl bg-secondary px-4 py-3">
          <Search size={16} className="text-muted-foreground" />
          <input
            placeholder="Search help articles..."
            className="flex-1 bg-transparent outline-none text-sm"
          />
        </div>
        <p className="text-xs font-semibold text-muted-foreground mt-6 mb-2">Popular Topics</p>
        <div className="rounded-2xl bg-surface border border-border divide-y divide-border">
          {topics.map((t) => (
            <Link key={t} to="/inbox" className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium">{t}</span>
              <ChevronRight size={16} className="text-muted-foreground" />
            </Link>
          ))}
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton to="/inbox">Contact Support</PrimaryButton>
      </div>
    </div>
  );
}
