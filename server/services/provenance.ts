import { getSupabase } from "../db.js";

type CertificateInput = {
  artworkId: string;
  holderProfileId: string;
  source: "order_paid" | "offer_accepted";
  sourceId: string;
};

type ExistingCertificateRow = {
  id: string;
  holder_profile_id: string;
};

function certificatePayload(input: CertificateInput) {
  return {
    source: input.source,
    sourceId: input.sourceId,
    issuedAt: new Date().toISOString(),
    note: "On-chain provenance certificate queued for minting.",
  };
}

export async function issueProvenanceCertificate(input: CertificateInput) {
  const supabase = getSupabase();
  const now = new Date().toISOString();

  const { data: activeCerts, error: activeError } = await supabase
    .from("provenance_certificates")
    .select("id, holder_profile_id")
    .eq("artwork_id", input.artworkId)
    .eq("status", "active");

  if (activeError && isMissingProvenanceTableError(activeError)) return null;
  if (activeError) throw activeError;

  const previousCerts = (activeCerts ?? []) as ExistingCertificateRow[];
  const previousHolderCerts = previousCerts.filter(
    (certificate) => certificate.holder_profile_id !== input.holderProfileId,
  );

  if (previousHolderCerts.length) {
    const { error } = await supabase
      .from("provenance_certificates")
      .update({
        status: "burned",
        burned_at: now,
        burn_payload: {
          reason: "ownership_transferred",
          source: input.source,
          sourceId: input.sourceId,
        },
        updated_at: now,
      })
      .in(
        "id",
        previousHolderCerts.map((certificate) => certificate.id),
      );

    if (error) throw error;
  }

  const { data: existingHolderCert, error: holderCertError } = await supabase
    .from("provenance_certificates")
    .select("id")
    .eq("artwork_id", input.artworkId)
    .eq("holder_profile_id", input.holderProfileId)
    .eq("status", "active")
    .maybeSingle();

  if (holderCertError) throw holderCertError;
  if (existingHolderCert) return existingHolderCert;

  const { data, error } = await supabase
    .from("provenance_certificates")
    .insert({
      artwork_id: input.artworkId,
      holder_profile_id: input.holderProfileId,
      source: input.source,
      source_id: input.sourceId,
      status: "active",
      onchain_status: "pending_mint",
      chain: "solana",
      certificate_payload: certificatePayload(input),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

function isMissingProvenanceTableError(error: { code?: string; message?: string }) {
  const message = String(error.message ?? "").toLowerCase();
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    (message.includes("provenance_certificates") && message.includes("schema"))
  );
}
