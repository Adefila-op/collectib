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
    solana?: SolanaProvider;
    solflare?: SolanaProvider;
    metamask?: {
      solana?: SolanaProvider;
    };
  }
}

export type SupportedWalletId = "phantom" | "solflare" | "metamask";

const WALLET_NAMES: Record<SupportedWalletId, string> = {
  phantom: "Phantom",
  solflare: "Solflare",
  metamask: "MetaMask",
};

function isSolanaProvider(provider: SolanaProvider | undefined | null): provider is SolanaProvider {
  return Boolean(provider?.connect && provider.signMessage);
}

export function getSolanaProvider(walletId: SupportedWalletId) {
  if (walletId === "phantom" && isSolanaProvider(window.solana) && window.solana.isPhantom) {
    return window.solana;
  }
  if (walletId === "solflare" && isSolanaProvider(window.solflare) && window.solflare.isSolflare) {
    return window.solflare;
  }
  if (walletId === "metamask") {
    if (isSolanaProvider(window.metamask?.solana)) return window.metamask.solana;
    if (isSolanaProvider(window.solana) && !window.solana.isPhantom && !window.solana.isSolflare) {
      return window.solana;
    }
  }
  return null;
}

export function getWalletInstallUrl(walletId: SupportedWalletId) {
  if (walletId === "phantom") return "https://phantom.app/download";
  if (walletId === "solflare") return "https://solflare.com/download";
  return "https://metamask.io/download/";
}

export function isMobileWalletEnvironment() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function getWalletAppUrl(walletId: SupportedWalletId) {
  const currentUrl = window.location.href;
  const ref = window.location.origin;

  if (walletId === "phantom") {
    return `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(ref)}`;
  }
  if (walletId === "solflare") {
    return `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(ref)}`;
  }

  const dappUrl = currentUrl.replace(/^https?:\/\//, "");
  return `https://metamask.app.link/dapp/${dappUrl}`;
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
