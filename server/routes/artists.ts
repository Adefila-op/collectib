import { Router } from "express";
import { getSupabase } from "../db.js";

const router = Router();

type ArtworkRow = {
  id: string;
  title: string;
  description?: string | null;
  price_amount: number | string;
  price_currency: string;
  image_url?: string | null;
  status: string;
  created_at?: string;
};

type ArtistRow = {
  id: string;
  name: string;
  slug?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  location?: string | null;
  practice?: string | null;
  collection_title?: string | null;
  is_featured?: boolean | null;
  artworks?: ArtworkRow[] | null;
};

router.get("/", async (_req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artists")
      .select("*, artworks(*)")
      .eq("is_featured", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return res.json({ artists: ((data ?? []) as ArtistRow[]).map(normalizeArtist) });
  } catch (error) {
    next(error);
  }
});

router.get("/collections", async (_req, res, next) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("artists")
      .select("*, artworks(*)")
      .eq("is_featured", true)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return res.json({
      collections: ((data ?? []) as ArtistRow[]).map((artist) => {
        const normalized = normalizeArtist(artist);
        return {
          id: normalized.id,
          title: normalized.collectionTitle,
          owner: "Collectibles Admin",
          artist: normalized,
          artworks: normalized.artworks,
        };
      }),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const supabase = getSupabase();
    const lookup = supabase
      .from("artists")
      .select("*, artworks(*)");
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      req.params.id,
    );
    const { data, error } = await (isUuid
      ? lookup.eq("id", req.params.id).single()
      : lookup.eq("slug", req.params.id).single());

    if (error) throw error;
    return res.json({ artist: normalizeArtist(data as ArtistRow) });
  } catch (error) {
    next(error);
  }
});

function normalizeArtist(artist: ArtistRow) {
  const artworks = (artist.artworks ?? []).sort((a, b) =>
    String(b.created_at ?? "").localeCompare(String(a.created_at ?? "")),
  );

  return {
    id: artist.slug ?? artist.id,
    databaseId: artist.id,
    name: artist.name,
    slug: artist.slug,
    bio: artist.bio,
    avatarUrl: artist.avatar_url,
    location: artist.location,
    practice: artist.practice,
    collectionTitle: artist.collection_title ?? `${artist.name} Collection`,
    isFeatured: Boolean(artist.is_featured),
    ownedCount: artworks.filter((artwork) => artwork.status === "owned").length,
    availableCount: artworks.filter((artwork) => artwork.status === "listed").length,
    artworks,
  };
}

export default router;
