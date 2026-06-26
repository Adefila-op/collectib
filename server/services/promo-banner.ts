import { z } from "zod";
import { getSupabase } from "../db.js";

const HOME_PROMO_ID = "home";

export const promoBannerSchema = z.object({
  greeting: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(140),
  ctaLabel: z.string().trim().min(1).max(40),
  detailsTitle: z.string().trim().min(1).max(120),
  detailsBody: z.string().trim().min(1).max(1200),
});

export type PromoBannerConfig = z.infer<typeof promoBannerSchema>;

export const defaultPromoBanner: PromoBannerConfig = {
  greeting: "Hello Collector.",
  message: "Get free delivery every $20 purchase",
  ctaLabel: "Learn More",
  detailsTitle: "Free delivery on $20 purchases",
  detailsBody:
    "Enjoy free delivery whenever your checkout total reaches $20 or more. The offer applies automatically to eligible marketplace purchases before payment.",
};

type PromoBannerRow = {
  greeting?: string | null;
  message?: string | null;
  cta_label?: string | null;
  details_title?: string | null;
  details_body?: string | null;
  updated_at?: string | null;
};

function toPromoBanner(row: PromoBannerRow | null): PromoBannerConfig & { updatedAt?: string } {
  if (!row) return defaultPromoBanner;

  return {
    greeting: row.greeting || defaultPromoBanner.greeting,
    message: row.message || defaultPromoBanner.message,
    ctaLabel: row.cta_label || defaultPromoBanner.ctaLabel,
    detailsTitle: row.details_title || defaultPromoBanner.detailsTitle,
    detailsBody: row.details_body || defaultPromoBanner.detailsBody,
    updatedAt: row.updated_at || undefined,
  };
}

export async function getHomePromoBanner() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("promo_banners")
    .select("greeting, message, cta_label, details_title, details_body, updated_at")
    .eq("id", HOME_PROMO_ID)
    .maybeSingle();

  if (error) throw error;
  return toPromoBanner(data as PromoBannerRow | null);
}

export async function updateHomePromoBanner(payload: PromoBannerConfig) {
  const banner = promoBannerSchema.parse(payload);
  const supabase = getSupabase();
  const updatedAt = new Date().toISOString();

  const { data, error } = await supabase
    .from("promo_banners")
    .upsert(
      {
        id: HOME_PROMO_ID,
        greeting: banner.greeting,
        message: banner.message,
        cta_label: banner.ctaLabel,
        details_title: banner.detailsTitle,
        details_body: banner.detailsBody,
        updated_at: updatedAt,
      },
      { onConflict: "id" },
    )
    .select("greeting, message, cta_label, details_title, details_body, updated_at")
    .single();

  if (error) throw error;
  return toPromoBanner(data as PromoBannerRow);
}
