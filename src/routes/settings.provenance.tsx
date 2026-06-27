import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { getPortfolio, type ProvenanceCertificate } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/settings/provenance")({
  component: ProvenanceSettings,
});

function ProvenanceSettings() {
  const [certificates, setCertificates] = useState<ProvenanceCertificate[]>([]);
  const [status, setStatus] = useState("Loading certificates...");

  useEffect(() => {
    let cancelled = false;
    getPortfolio()
      .then((portfolio) => {
        if (cancelled) return;
        const active = portfolio.provenanceCertificates.filter((certificate) => certificate.status === "active");
        setCertificates(active);
        setStatus(active.length ? "" : "No active provenance certificates yet.");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error instanceof Error ? error.message : "Could not load certificates.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Provenance" />
      <div className="px-5 space-y-3">
        {status && <p className="text-sm text-muted-foreground">{status}</p>}
        {certificates.map((certificate) => (
          <Link
            key={certificate.id}
            to="/provenance/$id"
            params={{ id: certificate.artwork_id }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
              <ShieldCheck size={20} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {certificate.artworks?.title ?? "Provenance certificate"}
              </span>
              <span className="mt-1 block text-xs capitalize text-muted-foreground">
                {String(certificate.onchain_status ?? "pending_mint").replace(/_/g, " ")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
