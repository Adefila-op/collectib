import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { patchAdminTableData } from "@/lib/api";
import { toast } from "sonner";
import { X, Save, Loader2 } from "lucide-react";

// Fields to completely hide from the edit form
const HIDDEN_FIELDS = new Set([
  "id", "profile_id", "seller_profile_id", "artist_id",
  "created_at", "updated_at", "joined_at",
  "password_hash", "payment_payload", "settlement_signature", "burn_payload",
  "asking_price", "token_mint", "metadata_uri",
]);

// Status-field option sets
const STATUS_OPTIONS: Record<string, string[]> = {
  artists_status: ["pending", "approved", "suspended"],
  artworks_status: ["listed", "sold", "unlisted", "removed"],
  orders_status: ["pending", "paid", "failed", "refunded"],
  offers_status: ["pending", "accepted", "rejected", "expired"],
};

function toLocalDateTimeInput(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    // format as YYYY-MM-DDTHH:mm for datetime-local input
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

export function AdminEditModal({
  table,
  row,
  onClose,
  onSaved,
}: {
  table: string;
  row: any;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [formData, setFormData] = useState<any>(row);

  const mutation = useMutation({
    mutationFn: () => {
      const id = row.id ?? row.profile_id;
      return patchAdminTableData(table, id, formData);
    },
    onSuccess: () => {
      toast.success("Record updated");
      onSaved();
    },
    onError: (error: any) => {
      toast.error(error.message ?? "Failed to update");
    },
  });

  const handleChange = (key: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [key]: value }));
  };

  const editableKeys = Object.keys(row).filter((k) => !HIDDEN_FIELDS.has(k));
  const tableName = table.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-sm bg-[#0f0e1a] rounded-3xl border border-white/10 shadow-2xl flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/[0.07] flex-none">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-primary/70">Edit Record</p>
            <h3 className="text-base font-bold text-white">{tableName}</h3>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto slim-scrollbar px-5 py-4 space-y-4">
          {editableKeys.map((key) => {
            const val = formData[key];
            const label = key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
            const isBoolean = typeof val === "boolean";
            const isNumber = typeof val === "number";
            const isDate = key.endsWith("_at") || key.endsWith("_until") || key.endsWith("_date") || key.startsWith("starts_") || key.startsWith("ends_") || key.startsWith("expires_");
            const statusOpts = STATUS_OPTIONS[`${table}_${key}`] ?? (key === "status" ? STATUS_OPTIONS[`${table}_status`] : null);

            return (
              <div key={key} className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                  {label}
                </label>

                {isBoolean ? (
                  <button
                    type="button"
                    onClick={() => handleChange(key, !val)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${val ? "bg-primary" : "bg-white/10"}`}
                  >
                    <span
                      className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${val ? "translate-x-6" : "translate-x-0"}`}
                    />
                  </button>
                ) : statusOpts ? (
                  <select
                    value={String(val ?? "")}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
                  >
                    {statusOpts.map((opt) => (
                      <option key={opt} value={opt} className="bg-[#0f0e1a]">{opt}</option>
                    ))}
                  </select>
                ) : isDate ? (
                  <input
                    type="datetime-local"
                    value={toLocalDateTimeInput(val)}
                    onChange={(e) => handleChange(key, e.target.value ? new Date(e.target.value).toISOString() : null)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
                  />
                ) : isNumber ? (
                  <input
                    type="number"
                    value={val ?? ""}
                    onChange={(e) => handleChange(key, Number(e.target.value))}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all"
                  />
                ) : (
                  <input
                    type="text"
                    value={val ?? ""}
                    onChange={(e) => handleChange(key, e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary/60 transition-all placeholder:text-white/20"
                    placeholder={label}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-white/[0.07] flex-none">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {mutation.isPending ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
