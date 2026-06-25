type SolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  publicKey?: { toString(): string };
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect?(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: "utf8"): Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
  }
}

export type SupportedWalletId = "phantom" | "solflare";

export function getSolanaProvider(walletId: SupportedWalletId) {
  if (walletId === "phantom" && window.solana?.isPhantom) return window.solana;
  if (walletId === "solflare" && window.solflare?.isSolflare) return window.solflare;
  return null;
}

export function getWalletInstallUrl(walletId: SupportedWalletId) {
  return walletId === "phantom" ? "https://phantom.app/download" : "https://solflare.com/download";
}

export async function connectSolanaWallet(walletId: SupportedWalletId) {
  const provider = getSolanaProvider(walletId);
  if (!provider) {
    throw new Error(`Install ${walletId === "phantom" ? "Phantom" : "Solflare"} to connect.`);
  }

  const response = await provider.connect();
  return {
    provider,
    walletAddress: response.publicKey.toString(),
  };
}

export async function signLoginMessage(provider: SolanaProvider, message: string) {
  const encodedMessage = new TextEncoder().encode(message);
  const { signature } = await provider.signMessage(encodedMessage, "utf8");
  return Array.from(signature);
}

export function shortWalletAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
