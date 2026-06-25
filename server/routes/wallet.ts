import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

async function canReadWallet(address: string, profileId?: string) {
  if (!profileId) return false;

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("connected_wallets")
    .select("wallet_address")
    .eq("wallet_address", address)
    .eq("profile_id", profileId)
    .maybeSingle();

  if (error) throw error;
  return Boolean(data);
}

async function assertWalletAccess(req: AuthedRequest, res: Response, address: string) {
  if (address === req.user?.walletAddress || (await canReadWallet(address, req.user?.sub))) {
    return true;
  }

  res.status(403).json({ error: "Wallet data is limited to your connected wallets." });
  return false;
}

async function heliusRpc<T>(method: string, params: unknown) {
  requireEnv("heliusApiKey");

  const response = await fetch(`https://mainnet.helius-rpc.com/?api-key=${config.heliusApiKey}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: `collectibles-${method}`,
      method,
      params,
    }),
  });

  const body = await response.json();
  if (!response.ok || body.error) {
    throw new Error(`Helius request failed: ${JSON.stringify(body.error ?? body)}`);
  }

  return body.result as T;
}

router.get("/:address/overview", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const address = z.string().min(32).max(64).parse(req.params.address);
    if (!(await assertWalletAccess(req, res, address))) return;

    const [balance, assetsResult] = await Promise.all([
      heliusRpc<{ value: number }>("getBalance", [address]),
      heliusRpc<{ items?: unknown[]; nativeBalance?: unknown }>("getAssetsByOwner", {
        ownerAddress: address,
        page: 1,
        limit: 100,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
          showCollectionMetadata: true,
        },
      }),
    ]);

    return res.json({
      walletAddress: address,
      lamports: balance.value,
      solBalance: balance.value / 1_000_000_000,
      assets: assetsResult.items ?? [],
      pagination: assetsResult,
      checkedAt: new Date().toISOString(),
    });
  } catch (error) {
    next(error);
  }
});

router.get("/:address/nfts", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const address = z.string().min(32).max(64).parse(req.params.address);
    if (!(await assertWalletAccess(req, res, address))) return;

    const result = await heliusRpc<{ items?: unknown[] }>("getAssetsByOwner", {
      ownerAddress: address,
      page: Math.max(1, Number(req.query.page ?? 1) || 1),
      limit: Math.min(Math.max(1, Number(req.query.limit ?? 50) || 50), 100),
      displayOptions: {
        showFungible: false,
        showNativeBalance: false,
        showCollectionMetadata: true,
      },
    });

    return res.json({ assets: result.items ?? [], pagination: result });
  } catch (error) {
    next(error);
  }
});

export default router;
