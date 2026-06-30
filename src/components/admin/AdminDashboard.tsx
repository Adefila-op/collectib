import { type FormEvent, useEffect, useState } from "react";
import {
  DEFAULT_PROMO_BANNER,
  getAdminPromoBanner,
  getAdminSummary,
  updateAdminPromoBanner,
  type Order,
  type PromoBanner,
} from "@/lib/api";
import { formatLocalPrice } from "@/lib/pricing";
import { AdminDataTable } from "./AdminDataTable";

type AdminSummary = Awaited<ReturnType<typeof getAdminSummary>>;
type Tab = "overview" | "profiles" | "artists" | "artworks" | "offers" | "orders" | "affiliates" | "promo" | "webhooks";

export function AdminDashboard() {
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [promoBanner, setPromoBanner] = useState<PromoBanner>(DEFAULT_PROMO_BANNER);
  const [status, setStatus] = useState("Loading admin data...");
  const [promoStatus, setPromoStatus] = useState("");
  const [isSavingPromo, setIsSavingPromo] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    getAdminSummary()
      .then((response) => {
        setSummary(response);
        setStatus("");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not load admin data.");
      });

    getAdminPromoBanner()
      .then((response) => {
        setPromoBanner(response.banner);
      })
      .catch(() => {});
  }, []);

  const handlePromoSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSavingPromo) return;

    setIsSavingPromo(true);
    setPromoStatus("");

    try {
      const response = await updateAdminPromoBanner(promoBanner);
      setPromoBanner(response.banner);
      setPromoStatus("Promo banner saved.");
    } catch (error) {
      setPromoStatus(error instanceof Error ? error.message : "Could not save promo banner.");
    } finally {
      setIsSavingPromo(false);
    }
  };

  return (
    <div className="relative flex-1 overflow-hidden flex flex-col h-full w-full">
      {/* Background Orbs */}
      <div
        aria-hidden
        className="pointer-events-none fixed top-[10%] left-[-10%] w-[340px] h-[340px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.62 0.19 295 / 0.15) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none fixed bottom-[10%] right-[-10%] w-[300px] h-[300px] rounded-full"
        style={{
          background: "radial-gradient(circle, oklch(0.55 0.22 260 / 0.15) 0%, transparent 70%)",
          filter: "blur(48px)",
        }}
      />

      <div className="relative z-10 flex flex-col h-full">
        {/* Glass Tabs */}
        <div className="px-4 py-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-white/5 bg-white/[0.01]">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")}>Overview</TabButton>
          <TabButton active={activeTab === "profiles"} onClick={() => setActiveTab("profiles")}>Users</TabButton>
          <TabButton active={activeTab === "artists"} onClick={() => setActiveTab("artists")}>Artists</TabButton>
          <TabButton active={activeTab === "artworks"} onClick={() => setActiveTab("artworks")}>Artworks</TabButton>
          <TabButton active={activeTab === "affiliates"} onClick={() => setActiveTab("affiliates")}>Campaigns</TabButton>
          <TabButton active={activeTab === "offers"} onClick={() => setActiveTab("offers")}>Offers</TabButton>
          <TabButton active={activeTab === "orders"} onClick={() => setActiveTab("orders")}>Orders</TabButton>
          <TabButton active={activeTab === "promo"} onClick={() => setActiveTab("promo")}>Promo</TabButton>
          <TabButton active={activeTab === "webhooks"} onClick={() => setActiveTab("webhooks")}>Webhooks</TabButton>
        </div>

        <div className="flex-1 overflow-y-auto slim-scrollbar">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="px-5 py-6">
              {status && <p className="text-sm text-white/60 mb-4">{status}</p>}
              {summary && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard label="Total Revenue" value={formatLocalPrice(summary.stats.revenue ?? 0, "USD")} />
                  <StatCard label="Paid Orders" value={String(summary.stats.paidOrders ?? 0)} />
                  <StatCard label="Listed Artworks" value={String(summary.stats.listedArtworks ?? 0)} />
                  <StatCard label="Active Offers" value={String(summary.stats.activeOffers ?? 0)} />
                  <StatCard label="Webhooks" value={String(summary.stats.webhookEvents ?? 0)} />
                  <StatCard label="Total Orders" value={String(summary.stats.orders ?? 0)} />
                </div>
              )}
            </div>
          )}

          {/* Dynamic Data Tables */}
          {activeTab === "profiles" && <AdminDataTable table="profiles" />}
          {activeTab === "artists" && <AdminDataTable table="artists" />}
          {activeTab === "artworks" && <AdminDataTable table="artworks" />}
          {activeTab === "offers" && <AdminDataTable table="offers" />}
          {activeTab === "orders" && <AdminDataTable table="orders" />}
          {activeTab === "affiliates" && <AdminDataTable table="affiliate_campaigns" />}

          {/* Promo Banner Tab */}
          {activeTab === "promo" && (
            <div className="px-5 py-6 max-w-2xl mx-auto">
              <form onSubmit={handlePromoSubmit} className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-3 mb-5">
                  <h2 className="text-base font-semibold">Homepage Banner Settings</h2>
                  <button
                    type="submit"
                    disabled={isSavingPromo}
                    className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-white transition-transform active:scale-95 disabled:opacity-60"
                  >
                    {isSavingPromo ? "Saving..." : "Save Changes"}
                  </button>
                </div>
                
                {promoStatus && <p className="mb-4 text-xs text-primary/80 font-medium">{promoStatus}</p>}
                
                <div className="grid gap-4">
                  <AdminField
                    label="Greeting (Top Left)"
                    value={promoBanner.greeting}
                    onChange={(greeting) => setPromoBanner((current) => ({ ...current, greeting }))}
                  />
                  <AdminField
                    label="Offer Text (Main Banner)"
                    value={promoBanner.message}
                    onChange={(message) => setPromoBanner((current) => ({ ...current, message }))}
                  />
                  <AdminField
                    label="Button Label"
                    value={promoBanner.ctaLabel}
                    onChange={(ctaLabel) => setPromoBanner((current) => ({ ...current, ctaLabel }))}
                  />
                  <AdminField
                    label="Modal Title"
                    value={promoBanner.detailsTitle}
                    onChange={(detailsTitle) => setPromoBanner((current) => ({ ...current, detailsTitle }))}
                  />
                  <AdminField
                    label="Modal Body Details"
                    value={promoBanner.detailsBody}
                    onChange={(detailsBody) => setPromoBanner((current) => ({ ...current, detailsBody }))}
                    multiline
                  />
                </div>
              </form>
            </div>
          )}

          {/* Webhooks Tab */}
          {activeTab === "webhooks" && summary && (
            <div className="px-5 py-6 max-w-2xl mx-auto">
              <div className="rounded-3xl bg-white/5 border border-white/10 divide-y divide-white/10 backdrop-blur-sm overflow-hidden">
                {summary.recentWebhooks.map((event) => (
                  <div key={event.id} className="p-4 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold capitalize">{event.provider}</span>
                      <span className="text-xs font-mono text-white/40">{new Date(event.created_at || "").toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-white/70">
                      <span className="font-semibold text-primary/80">{event.event_type}</span>
                      {event.external_id ? ` · Ref: ${event.external_id}` : ""}
                    </p>
                  </div>
                ))}
                {summary.recentWebhooks.length === 0 && (
                  <p className="p-5 text-sm text-white/50 text-center">No webhook events recorded.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-semibold transition-all ${
        active 
          ? "bg-white/10 text-white border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.05)]" 
          : "text-white/50 hover:text-white/80 hover:bg-white/5 border border-transparent"
      }`}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-white/5 border border-white/10 p-5 backdrop-blur-sm hover:bg-white/10 transition-colors">
      <p className="text-[10px] uppercase tracking-wider font-semibold text-white/50">{label}</p>
      <p className="text-2xl font-black mt-2 text-white drop-shadow-md">{value}</p>
    </div>
  );
}

function AdminField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">
        {label}
      </span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20"
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all placeholder:text-white/20"
        />
      )}
    </label>
  );
}
