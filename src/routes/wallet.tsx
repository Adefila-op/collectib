import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import {
  clearSession,
  getAuthToken,
  getWalletAddress,
  getWalletOverview,
  getWalletTransactions,
  type WalletOverview,
  type WalletTransaction,
} from "@/lib/api";
import { shortWalletAddress } from "@/lib/solana-wallet";

export const Route = createFileRoute("/wallet")({
  component: Wallet,
});

type WalletAsset = {
  id?: string;
  name?: string;
  content?: {
    metadata?: {
      name?: string;
      symbol?: string;
    };
    links?: {
      image?: string;
    };
  };
  grouping?: Array<{
    group_key?: string;
    group_value?: string;
  }>;
};

function Wallet() {
  const [walletAddress, setWalletAddress] = useState(() => getWalletAddress() ?? "");
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [assets, setAssets] = useState<WalletAsset[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!getAuthToken() || !walletAddress) return;

    let isMounted = true;
    setIsLoading(true);
    setStatus("");

    Promise.all([getWalletOverview(walletAddress), getWalletTransactions(walletAddress, 5)])
      .then(([response, transactionResponse]) => {
        if (!isMounted) return;
        setOverview(response);
        setAssets(response.assets as WalletAsset[]);
        setTransactions(transactionResponse.signatures);
        setStatus(response.assets.length ? "" : "No NFTs found for this wallet.");
      })
      .catch((error) => {
        if (!isMounted) return;
        setStatus(error instanceof Error ? error.message : "Could not load wallet assets.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  const handleDisconnect = () => {
    clearSession();
    setWalletAddress("");
    setOverview(null);
    setAssets([]);
    setTransactions([]);
    setStatus("Wallet disconnected");
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <StatusBar />
      <TopBar title="Wallet" />
      <div className="mx-5 rounded-3xl bg-primary text-primary-foreground p-5">
        <p className="text-xs opacity-80">Connected Wallet</p>
        <p className="text-2xl font-extrabold mt-1">
          {walletAddress ? shortWalletAddress(walletAddress) : "Not connected"}
        </p>
        {walletAddress && <p className="text-xs opacity-80 mt-1 font-mono">{walletAddress}</p>}
        {walletAddress && (
          <div className="mt-4 rounded-2xl bg-white/10 p-3">
            <p className="text-xs opacity-75">Live SOL balance</p>
            <p className="text-3xl font-extrabold mt-1">
              {overview
                ? overview.solBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })
                : "--"}{" "}
              SOL
            </p>
            {overview?.checkedAt && (
              <p className="text-[11px] opacity-70 mt-1">
                Updated {new Date(overview.checkedAt).toLocaleTimeString()}
              </p>
            )}
          </div>
        )}
        <div className="flex gap-2 mt-4">
          {walletAddress ? (
            <button
              onClick={handleDisconnect}
              className="flex-1 py-2.5 rounded-xl bg-white/15 font-semibold text-sm"
            >
              Disconnect
            </button>
          ) : (
            <Link
              to="/onboarding/wallet"
              className="flex-1 py-2.5 rounded-xl bg-white/15 font-semibold text-sm text-center"
            >
              Connect
            </Link>
          )}
        </div>
      </div>

      {walletAddress && (
        <>
          <h2 className="px-5 mt-6 font-semibold">Recent Activity</h2>
          <div className="mx-5 mt-3 rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
            {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading activity...</p>}
            {!isLoading && transactions.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">No recent transactions found.</p>
            )}
            {!isLoading &&
              transactions.map((transaction) => (
                <a
                  key={transaction.signature}
                  href={`https://solscan.io/tx/${transaction.signature}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4"
                >
                  <p className="font-mono text-xs font-semibold">
                    {shortWalletAddress(transaction.signature)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {transaction.blockTime
                      ? new Date(transaction.blockTime * 1000).toLocaleString()
                      : "Recent Solana transaction"}
                  </p>
                </a>
              ))}
          </div>
        </>
      )}

      <h2 className="px-5 mt-6 font-semibold">Wallet Assets</h2>
      <div className="mx-5 mt-3 rounded-2xl bg-surface border border-border divide-y divide-border overflow-hidden">
        {isLoading && <p className="p-4 text-sm text-muted-foreground">Loading assets...</p>}
        {!isLoading && !walletAddress && (
          <p className="p-4 text-sm text-muted-foreground">Connect a wallet to view assets.</p>
        )}
        {!isLoading &&
          assets.map((asset, index) => {
            const name = asset.content?.metadata?.name ?? asset.name ?? `NFT ${index + 1}`;
            const symbol = asset.content?.metadata?.symbol ?? "Solana NFT";
            const image = asset.content?.links?.image;

            return (
              <div key={asset.id ?? name} className="flex items-center justify-between p-4 gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center overflow-hidden font-bold text-xs shrink-0">
                    {image ? (
                      <img src={image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      symbol.slice(0, 3)
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{name}</p>
                    <p className="text-xs text-muted-foreground truncate">{symbol}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">NFT</p>
              </div>
            );
          })}
        {!isLoading && walletAddress && status && (
          <p className="p-4 text-sm text-muted-foreground">{status}</p>
        )}
      </div>
    </div>
  );
}
