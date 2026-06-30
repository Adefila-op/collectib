import re

file_path = "c:\\Users\\Admin\\Desktop\\collectib\\server\\routes\\me.ts"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# We know the exact structure of me.ts around line 170
# It currently has:
#       supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_profile_id", profileId),
#         type: "offer",
#         title: isReceived ? "Offer received" : "Offer sent",

target = """      supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_profile_id", profileId),
        type: "offer",
        title: isReceived ? "Offer received" : "Offer sent","""

replacement = """      supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_profile_id", profileId),
    ]);

    if (profile.error) throw profile.error;
    if (emailAccount.error) throw emailAccount.error;
    if (artist.error) throw artist.error;
    if (saved.error) throw saved.error;
    if (offers.error) throw offers.error;
    if (orders.error) throw orders.error;

    const profileRow = profile.data as ProfileRow;
    const emailRow = emailAccount.data as EmailAccountRow | null;
    const artistRow = artist.data as ArtistRow | null;

    return res.json({
      profile: {
        ...profileRow,
        email: req.user?.email ?? emailRow?.email ?? null,
        artist_id: artistRow?.id ?? null,
        stats: {
          connectedWallets: (saved as CountResult).count ?? 0,
          offers: (offers as CountResult).count ?? 0,
          orders: (orders as CountResult).count ?? 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

router.patch("/dashboard-type", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const { dashboardType } = req.body;
    if (dashboardType !== "collector" && dashboardType !== "artist") {
      return res.status(400).json({ error: "Invalid dashboard type." });
    }

    const supabase = getSupabase();
    
    // Update the profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ dashboard_type: dashboardType })
      .eq("id", profileId);

    if (updateError) throw updateError;

    // Fetch the updated profile to return
    const { data: profile, error: fetchError } = await supabase
      .from("profiles")
      .select("id, wallet_address, display_name, avatar_url, gender, dashboard_type, created_at")
      .eq("id", profileId)
      .single();

    if (fetchError || !profile) {
      throw fetchError || new Error("Failed to fetch updated profile");
    }

    // Attach email
    let email = null;
    if (profile.dashboard_type === "artist") {
      const { data: emailAccount } = await supabase
        .from("email_accounts")
        .select("email")
        .eq("profile_id", profileId)
        .single();
      if (emailAccount) {
        email = (emailAccount as EmailAccountRow).email;
      }
    }

    // Attach artist_id if artist
    let artistId = null;
    if (profile.dashboard_type === "artist") {
      const { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("profile_id", profileId)
        .single();
      if (artist) {
        artistId = (artist as ArtistRow).id;
      }
    }

    return res.json({
      profile: {
        ...profile,
        email,
        artist_id: artistId,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get("/activity", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const profileId = req.user?.sub;
    if (!profileId) return res.status(401).json({ error: "Missing authenticated user." });

    const supabase = getSupabase();
    const [offers, orders] = await Promise.all([
      supabase
        .from("offers")
        .select("id, amount, currency, status, buyer_profile_id, seller_profile_id, created_at, updated_at, artworks(title, image_url)")
        .or(`buyer_profile_id.eq.${profileId},seller_profile_id.eq.${profileId}`)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("orders")
        .select("id, amount, currency, status, payment_provider, created_at, updated_at, artworks(title, image_url)")
        .eq("buyer_profile_id", profileId)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    if (offers.error) throw offers.error;
    if (orders.error) throw orders.error;

    const offerRows = (offers.data ?? []) as ActivityOfferRow[];
    const orderRows = (orders.data ?? []) as ActivityOrderRow[];

    const offerItems = offerRows.map((offer) => {
      const isReceived = offer.seller_profile_id === profileId;
      return {
        id: `offer:${offer.id}`,
        type: "offer",
        title: isReceived ? "Offer received" : "Offer sent","""

content = content.replace(target, replacement)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patched me.ts successfully")
