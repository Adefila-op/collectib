import type { Response } from "express";
import { Router } from "express";
import { z } from "zod";
import { config, requireEnv } from "../config.js";
import { getSupabase } from "../db.js";
import { requireAuth } from "../middleware.js";
import type { AuthedRequest } from "../types.js";

const router = Router();

type HeliusRpcResponse<T> = {
  result?: T;
  error?: unknown;
};

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

  const body = (await response.json()) as HeliusRpcResponse<T>;
  if (!response.ok || body.error) {
    throw new Error(`Helius request failed: ${JSON.stringify(body.error ?? body)}`);
  }

  if (body.result === undefined) {
    throw new Error("Helius request returned no result.");
  }

  return body.result;
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

    const overview = {
      walletAddress: address,
      lamports: balance.value,
      solBalance: balance.value / 1_000_000_000,
      assets: assetsResult.items ?? [],
      pagination: assetsResult,
      checkedAt: new Date().toISOString(),
    };

    await getSupabase()
      .from("connected_wallets")
      .update({ holdings_snapshot: overview, last_connected_at: overview.checkedAt })
      .eq("wallet_address", address);

    return res.json(overview);
  } catch (error) {
    next(error);
  }
});

router.get("/:address/transactions", requireAuth, async (req: AuthedRequest, res, next) => {
  try {
    const address = z.string().min(32).max(64).parse(req.params.address);
    if (!(await assertWalletAccess(req, res, address))) return;

    const limit = Math.min(Math.max(1, Number(req.query.limit ?? 20) || 20), 50);
    const signatures = await heliusRpc<
      Array<{
        signature: string;
        slot?: number;
        blockTime?: number | null;
        err?: unknown;
        memo?: string | null;
      }>
    >("getSignaturesForAddress", [address, { limit }]);

    return res.json({ signatures });
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
