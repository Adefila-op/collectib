import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton, SecondaryButton } from "@/components/art-ui";
import { createLoginNonce, saveSession, verifyWalletSignature } from "@/lib/api";
import {
  connectSolanaWallet,
  getWalletInstallUrl,
  getWalletAppUrl,
  isMobileWalletEnvironment,
  shortWalletAddress,
  signLoginMessage,
  type SupportedWalletId,
} from "@/lib/solana-wallet";
import { Check } from "lucide-react";

export const Route = createFileRoute("/onboarding/wallet")({
  component: Wallet,
});

const WALLETS: Array<{
  id: SupportedWalletId;
  name: string;
  desc: string;
  color: string;
  letter: string;
}> = [
  {
    id: "phantom",
    name: "Phantom",
    desc: "Solana wallet",
    color: "#AB9FF2",
    letter: "P",
  },
  { id: "solflare", name: "Solflare", desc: "Solana wallet", color: "#FC7A1E", letter: "S" },
  {
    id: "metamask",
    name: "MetaMask",
    desc: "Solana wallet only",
    color: "#F6851B",
    letter: "M",
  },
];

function Wallet() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<SupportedWalletId | null>("phantom");
  const [connected, setConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [status, setStatus] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    if (!selected || isConnecting) return;

    setIsConnecting(true);
    setStatus("");

    try {
      const { provider, walletAddress } = await connectSolanaWallet(selected);
      const nonce = await createLoginNonce(walletAddress);
      const signature = await signLoginMessage(provider, nonce.message);
      const verified = await verifyWalletSignature(walletAddress, signature);

      saveSession(verified.token, walletAddress);
      setWalletAddress(walletAddress);
      setConnected(true);
      setStatus("Wallet connected");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Wallet connection failed.");
    } finally {
      setIsConnecting(false);
    }
  };

  const selectedWallet = WALLETS.find((wallet) => wallet.id === selected);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="px-6 flex-1">
        <h1 className="text-3xl font-extrabold leading-tight">
          Connect your
          <br />
          wallet
        </h1>
        <p className="text-muted-foreground text-sm mt-2">
          Securely buy, sell, and verify ownership of your collection.
        </p>

        {connected ? (
          <div className="mt-10 rounded-3xl bg-primary-softer border border-primary-soft p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <Check size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm">Wallet connected</p>
                <p className="text-xs text-muted-foreground font-mono">
                  {shortWalletAddress(walletAddress)}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              You can manage or disconnect this wallet anytime in Settings.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 mt-8">
            {WALLETS.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => setSelected(wallet.id)}
                className={`flex items-center gap-3 rounded-2xl border p-4 text-left transition ${
                  selected === wallet.id
                    ? "border-primary bg-primary-softer"
                    : "border-border bg-surface"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: wallet.color }}
                >
                  {wallet.letter}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm">{wallet.name}</p>
                  <p className="text-xs text-muted-foreground">{wallet.desc}</p>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 ${
                    selected === wallet.id ? "border-primary bg-primary" : "border-border"
                  } flex items-center justify-center`}
                >
                  {selected === wallet.id && (
                    <Check size={12} className="text-primary-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground mt-5 text-center px-4">
          By connecting, you agree to our{" "}
          <Link to="/terms" className="underline">
            Terms
          </Link>{" "}
          and acknowledge our{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>
          .
        </p>
        {status && (
          <p className="text-xs text-center text-muted-foreground mt-4" role="status">
            {status}
          </p>
        )}
      </div>

      <div className="p-6 space-y-2">
        {connected ? (
          <PrimaryButton onClick={() => navigate({ to: "/onboarding/wallet-success" })}>
            Continue
          </PrimaryButton>
        ) : (
          <>
            <PrimaryButton
              onClick={handleConnect}
              className={selected && !isConnecting ? "" : "opacity-50"}
            >
              {isConnecting
                ? "Connecting..."
                : selectedWallet
                  ? `Connect ${selectedWallet.name}`
                  : "Select a wallet"}
            </PrimaryButton>
            {selectedWallet && (
              <SecondaryButton
                onClick={() =>
                  window.open(
                    isMobileWalletEnvironment()
                      ? getWalletAppUrl(selectedWallet.id)
                      : getWalletInstallUrl(selectedWallet.id),
                    "_blank",
                    "noopener",
                  )
                }
              >
                {isMobileWalletEnvironment()
                  ? `Open ${selectedWallet.name} app`
                  : `Install ${selectedWallet.name}`}
              </SecondaryButton>
            )}
            <Link
              to="/onboarding/styles"
              className="block text-center text-sm font-medium text-muted-foreground py-2"
            >
              Skip for now
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
