type SolanaProvider = {
  isPhantom?: boolean;
  isSolflare?: boolean;
  isMetaMask?: boolean;
  publicKey?: { toString(): string };
  connect(options?: { onlyIfTrusted?: boolean }): Promise<{ publicKey: { toString(): string } }>;
  disconnect?(): Promise<void>;
  signMessage(message: Uint8Array, encoding?: "utf8"): Promise<{ signature: Uint8Array }>;
};

declare global {
  interface Window {
    phantom?: {
      solana?: SolanaProvider;
    };
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
  }
}

export type SupportedWalletId = "phantom" | "solflare";

const WALLET_NAMES: Record<SupportedWalletId, string> = {
  phantom: "Phantom",
  solflare: "Solflare",
};

function isSolanaProvider(provider: SolanaProvider | undefined | null): provider is SolanaProvider {
  return Boolean(provider?.connect && provider.signMessage);
}

export function getSolanaProvider(walletId: SupportedWalletId) {
  if (walletId === "phantom") {
    if (isSolanaProvider(window.phantom?.solana) && window.phantom.solana.isPhantom) {
      return window.phantom.solana;
    }
    if (isSolanaProvider(window.solana) && window.solana.isPhantom) {
      return window.solana;
    }
  }
  if (walletId === "solflare" && isSolanaProvider(window.solflare) && window.solflare.isSolflare) {
    return window.solflare;
  }
  return null;
}

export function getWalletInstallUrl(walletId: SupportedWalletId) {
  if (walletId === "phantom") return "https://phantom.app/download";
  return "https://solflare.com/download";
}

export function isMobileWalletEnvironment() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getWalletAppUrl(walletId: SupportedWalletId) {
  const currentPage = new URL(window.location.href);
  currentPage.searchParams.set("wallet", walletId);
  currentPage.searchParams.set("connect", "1");
  const currentUrl = currentPage.toString();
  const ref = window.location.origin;

  if (walletId === "phantom") {
    return `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(ref)}`;
  }
  if (walletId === "solflare") {
    return `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(ref)}`;
  }

  return currentUrl;
}

export async function connectSolanaWallet(walletId: SupportedWalletId) {
  const provider = getSolanaProvider(walletId);
  if (!provider) {
    if (isMobileWalletEnvironment()) {
      window.location.href = getWalletAppUrl(walletId);
      throw new Error(`Opening ${WALLET_NAMES[walletId]} wallet app...`);
    }

    throw new Error(`Install ${WALLET_NAMES[walletId]} and enable its Solana wallet to connect.`);
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
