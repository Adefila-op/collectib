import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { getAdminTableData, deleteAdminTableData } from "@/lib/api";
import { AdminEditModal } from "./AdminEditModal";
import { Edit2, Loader2, Search, SlidersHorizontal, X, ChevronDown, Trash2, AlertTriangle } from "lucide-react";

// ── Curated column config per table ─────────────────────────────────────────
// `card` = fields shown on the mobile card (max 3 for readability)
// `search` = which fields are searched
// `filters` = fields that get filter controls
const TABLE_CONFIG: Record<
  string,
  {
    columns: string[];
    labels?: Record<string, string>;
    card: string[];           // shown on mobile card
    search: string[];         // full-text searched
    filters?: FilterDef[];
  }
> = {
  profiles: {
    columns: ["display_name", "wallet_address", "email", "art_balance", "fiat_balance", "is_paused", "timeout_until", "dashboard_type"],
    labels: { wallet_address: "Wallet", display_name: "Name", art_balance: "Art Bal.", fiat_balance: "Fiat ($)", is_paused: "Paused", timeout_until: "Timeout", dashboard_type: "Role" },
    card: ["display_name", "email", "is_paused"],
    search: ["display_name", "wallet_address", "email"],
    filters: [
      { key: "is_paused", label: "Paused", type: "bool" },
      { key: "dashboard_type", label: "Role", type: "enum", options: ["collector", "artist", "admin"] },
      { key: "fiat_balance", label: "Fiat Balance", type: "numeric_gte" },
      { key: "art_balance", label: "Art Balance", type: "numeric_gte" },
    ],
  },
  artists: {
    columns: ["name", "location", "status", "is_verified", "is_featured", "slug"],
    labels: { is_verified: "Verified", is_featured: "Featured", status: "Status" },
    card: ["name", "location", "status"],
    search: ["name", "slug", "location"],
    filters: [
      { key: "status", label: "Status", type: "enum", options: ["pending", "approved", "suspended"] },
      { key: "is_verified", label: "Verified", type: "bool" },
      { key: "is_featured", label: "Featured", type: "bool" },
    ],
  },
  artworks: {
    columns: ["title", "price_amount", "price_currency", "status", "is_verified"],
    labels: { price_amount: "Price", is_verified: "Verified" },
    card: ["title", "price_amount", "status"],
    search: ["title"],
    filters: [
      { key: "status", label: "Status", type: "enum", options: ["listed", "sold", "unlisted", "removed"] },
      { key: "is_verified", label: "Verified", type: "bool" },
      { key: "price_amount", label: "Min Price", type: "numeric_gte" },
    ],
  },
  offers: {
    columns: ["offer_amount", "offer_currency", "status", "expires_at"],
    labels: { offer_amount: "Amount" },
    card: ["offer_amount", "offer_currency", "status"],
    search: [],
    filters: [
      { key: "status", label: "Status", type: "enum", options: ["pending", "accepted", "rejected", "expired"] },
    ],
  },
  orders: {
    columns: ["amount", "currency", "status", "provider", "created_at"],
    card: ["amount", "currency", "status"],
    search: [],
    filters: [
      { key: "status", label: "Status", type: "enum", options: ["pending", "paid", "failed", "refunded"] },
    ],
  },
  affiliate_campaigns: {
    columns: ["name", "code", "commission_rate", "is_active", "starts_at", "ends_at"],
    labels: { commission_rate: "Commission %", is_active: "Active" },
    card: ["name", "code", "is_active"],
    search: ["name", "code"],
    filters: [
      { key: "is_active", label: "Active", type: "bool" },
    ],
  },
};

type FilterDef =
  | { key: string; label: string; type: "bool" }
  | { key: string; label: string; type: "enum"; options: string[] }
  | { key: string; label: string; type: "numeric_gte" };

type ActiveFilter = { key: string; value: string };

// ── Helpers ──────────────────────────────────────────────────────────────────
function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") return value.toLocaleString();
  const s = String(value);
  if ((key.endsWith("_at") || key.endsWith("_until")) && s.includes("T")) {
    try { return new Date(s).toLocaleDateString(); } catch { /* fall through */ }
  }
  return s.length > 28 ? s.slice(0, 28) + "…" : s;
}

function pillClass(key: string, value: unknown): string {
  if (key === "status") {
    if (value === "approved" || value === "paid" || value === "accepted" || value === "listed") return "pill-green";
    if (value === "pending") return "pill-yellow";
    return "pill-red";
  }
  if (key === "is_paused") return value === true ? "pill-red" : "pill-green";
  if (key === "is_active") return value === true ? "pill-green" : "pill-red";
  if (key === "is_verified" || key === "is_featured") return value === true ? "pill-green" : "";
  return "";
}

function applyFilters(data: any[], filters: ActiveFilter[]): any[] {
  return filters.reduce((acc, f) => {
    if (!f.value) return acc;
    return acc.filter((row) => {
      const v = row[f.key];
      if (f.value === "true") return v === true;
      if (f.value === "false") return v === false;
      // numeric_gte: filter value is a min threshold
      const num = parseFloat(f.value);
      if (!isNaN(num) && typeof v === "number") return v >= num;
      return String(v ?? "").toLowerCase() === f.value.toLowerCase();
    });
  }, data);
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AdminDataTable({ table }: { table: string }) {
  const queryClient = useQueryClient();
  const [editingRow, setEditingRow] = useState<any | null>(null);
  const [deletingRow, setDeletingRow] = useState<any | null>(null);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState<ActiveFilter[]>([]);

  const { data: rawData, isLoading, error, refetch } = useQuery({
    queryKey: ["adminData", table],
    queryFn: () => getAdminTableData<any>(table).then((res) => res.data),
  });

  const config = TABLE_CONFIG[table];
  const cardCols = config?.card ?? [];
  const allCols = config?.columns ?? [];
  const searchKeys = config?.search ?? [];
  const filterDefs = config?.filters ?? [];
  const labels = config?.labels ?? {};

  // Apply search + filters
  const data = useMemo(() => {
    if (!rawData) return [];
    let result = rawData;

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((row: any) =>
        searchKeys.some((k) => String(row[k] ?? "").toLowerCase().includes(q))
      );
    }

    result = applyFilters(result, activeFilters);
    return result;
  }, [rawData, search, activeFilters, searchKeys]);

  const setFilter = (key: string, value: string) => {
    setActiveFilters((prev) => {
      const existing = prev.findIndex((f) => f.key === key);
      if (!value) return prev.filter((_, i) => i !== existing);
      if (existing >= 0) return prev.map((f, i) => (i === existing ? { key, value } : f));
      return [...prev, { key, value }];
    });
  };

  const getFilterValue = (key: string) =>
    activeFilters.find((f) => f.key === key)?.value ?? "";

  // ── Render states ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 gap-3 text-white/40">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span className="text-sm">Loading…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-4 mt-5 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
        {(error as Error).message}
      </div>
    );
  }

  return (
    <>
      {/* ── Search + Filter bar ── */}
      <div className="px-4 pt-3 pb-2 space-y-2 sticky top-0 z-10 bg-[#08070f]/90 backdrop-blur-md">
        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${table.replace(/_/g, " ")}…`}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
          {filterDefs.length > 0 && (
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                showFilters || activeFilters.length > 0
                  ? "bg-primary/20 border-primary/40 text-primary"
                  : "bg-white/5 border-white/10 text-white/60 hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Filter
              {activeFilters.length > 0 && (
                <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white">
                  {activeFilters.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Filter panel */}
        {showFilters && filterDefs.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              {filterDefs.map((def) => (
                <div key={def.key} className="flex flex-col gap-1">
                  <label className="text-[9px] uppercase tracking-widest font-bold text-white/35">{def.label}</label>
                  {def.type === "bool" ? (
                    <div className="relative">
                      <select
                        value={getFilterValue(def.key)}
                        onChange={(e) => setFilter(def.key, e.target.value)}
                        className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        <option value="" className="bg-[#0f0e1a]">Any</option>
                        <option value="true" className="bg-[#0f0e1a]">Yes</option>
                        <option value="false" className="bg-[#0f0e1a]">No</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
                    </div>
                  ) : def.type === "enum" ? (
                    <div className="relative">
                      <select
                        value={getFilterValue(def.key)}
                        onChange={(e) => setFilter(def.key, e.target.value)}
                        className="w-full appearance-none rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40"
                      >
                        <option value="" className="bg-[#0f0e1a]">Any</option>
                        {def.options.map((o) => (
                          <option key={o} value={o} className="bg-[#0f0e1a] capitalize">{o}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-white/30" />
                    </div>
                  ) : (
                    <input
                      type="number"
                      value={getFilterValue(def.key)}
                      onChange={(e) => setFilter(def.key, e.target.value)}
                      placeholder="Min value"
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-white/20"
                    />
                  )}
                </div>
              ))}
            </div>
            {activeFilters.length > 0 && (
              <button
                onClick={() => setActiveFilters([])}
                className="text-[10px] font-semibold text-primary/70 hover:text-primary underline underline-offset-2"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}

        {/* Result count */}
        <p className="text-[10px] text-white/30 font-medium px-0.5">
          {data.length} record{data.length !== 1 ? "s" : ""}
          {(search || activeFilters.length > 0) && rawData ? ` of ${rawData.length}` : ""}
        </p>
      </div>

      {/* ── Card list ── */}
      <div className="px-4 pb-24 space-y-2">
        {data.length === 0 ? (
          <div className="py-16 text-center text-sm text-white/30">
            No records match your search.
          </div>
        ) : (
          data.map((row: any, i: number) => {
            // Primary field (first card col) used as the row title
            const primary = formatCell(cardCols[0], row[cardCols[0]]);
            const rest = cardCols.slice(1);

            return (
              <div
                key={row.id ?? i}
                className="group relative rounded-2xl border border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.14] transition-all px-4 py-3 flex items-center gap-3"
              >
                {/* Edit btn */}
                <button
                  onClick={() => setEditingRow(row)}
                  className="flex-none flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 hover:bg-primary/25 text-primary transition-colors"
                  title="Edit"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Primary name */}
                  <p className="text-sm font-semibold text-white truncate">{primary || "—"}</p>

                  {/* Secondary fields */}
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    {rest.map((col) => {
                      const raw = row[col];
                      const pill = pillClass(col, raw);
                      const text = formatCell(col, raw);
                      const lbl = labels[col] ?? col.replace(/_/g, " ");

                      return pill ? (
                        <span
                          key={col}
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            pill === "pill-green"
                              ? "bg-emerald-500/15 text-emerald-400"
                              : pill === "pill-yellow"
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-red-500/15 text-red-400"
                          }`}
                        >
                          {lbl}: {text}
                        </span>
                      ) : (
                        <span key={col} className="text-[11px] text-white/45 truncate max-w-[140px]">
                          {lbl}: {text}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Delete btn */}
                <button
                  onClick={() => setDeletingRow(row)}
                  className="flex-none flex h-8 w-8 items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/25 text-red-400 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {editingRow && (
        <AdminEditModal
          table={table}
          row={editingRow}
          onClose={() => setEditingRow(null)}
          onSaved={() => {
            setEditingRow(null);
            refetch();
          }}
        />
      )}

      {deletingRow && (
        <DeleteConfirmModal
          table={table}
          row={deletingRow}
          onClose={() => setDeletingRow(null)}
          onDeleted={() => {
            setDeletingRow(null);
            queryClient.invalidateQueries({ queryKey: ["adminData", table] });
          }}
        />
      )}
    </>
  );
}

// ── Delete Confirm Modal ───────────────────────────────────────────────────────
function DeleteConfirmModal({
  table,
  row,
  onClose,
  onDeleted,
}: {
  table: string;
  row: any;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const mutation = useMutation({
    mutationFn: () => {
      const id = row.id ?? row.profile_id;
      return deleteAdminTableData(table, id);
    },
    onSuccess: () => {
      import("sonner").then((mod) => mod.toast.success("Record deleted"));
      onDeleted();
    },
    onError: (error: any) => {
      import("sonner").then((mod) => mod.toast.error(error.message ?? "Failed to delete record"));
      onClose(); // Optional: close it or let them try again. Let's just let the toast show
    },
  });

  // Best display label for the record being deleted
  const recordLabel =
    row.display_name ?? row.name ?? row.title ?? row.code ?? row.id ?? "this record";

  return (
    <div
      className="fixed inset-0 z-[130] flex items-center justify-center p-5 bg-black/75 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xs bg-[#0f0e1a] rounded-3xl border border-red-500/20 shadow-2xl p-6 flex flex-col items-center text-center gap-4">
        {/* Icon */}
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <div>
          <h3 className="text-base font-bold text-white">Delete Record?</h3>
          <p className="text-sm text-white/50 mt-1">
            You are about to permanently delete{" "}
            <span className="font-semibold text-white/80">{recordLabel}</span>.
            This cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            {mutation.isPending ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
