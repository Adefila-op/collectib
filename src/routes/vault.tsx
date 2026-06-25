import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { Chip } from "@/components/art-ui";
import { ChevronRight } from "lucide-react";

export const Route = createFileRoute("/vault")({
  component: Vault,
});

function Vault() {
  const [tab, setTab] = useState("Stored");
  return (
    <MobileShell>
      <div className="px-5 pt-2">
        <h1 className="text-2xl font-extrabold">Collection Vault</h1>
      </div>
      <div className="flex gap-2 px-5 mt-4">
        {["Stored", "In Transit", "Delivered"].map((t) => (
          <Chip key={t} active={tab === t} onClick={() => setTab(t)}>
            {t}
          </Chip>
        ))}
      </div>
      <div className="px-5 mt-5 space-y-3">
        {[
          ["Ethereal Flow", "Stored - Secured Vault"],
          ["Golden Balance", "Stored - Secured Vault"],
          ["Silent Thoughts", "In Transit - Expected May 28"],
          ["Bloom Within", "Delivered"],
        ].map(([t, s], i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl bg-surface border border-border p-3"
          >
            <div className="w-14 h-14 rounded-xl bg-accent" />
            <div className="flex-1">
              <p className="font-semibold text-sm">{t}</p>
              <p className="text-xs text-muted-foreground">{s}</p>
            </div>
            <ChevronRight size={18} className="text-muted-foreground" />
          </div>
        ))}
      </div>
    </MobileShell>
  );
}
