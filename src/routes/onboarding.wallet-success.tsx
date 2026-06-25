import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PrimaryButton } from "@/components/art-ui";
import { StatusBar } from "@/components/mobile-shell";
import { getAuthToken, getWalletAddress, getWalletOverview, type WalletOverview } from "@/lib/api";

export const Route = createFileRoute("/onboarding/wallet-success")({
  component: WalletSuccess,
});

function WalletSuccess() {
  const walletAddress = getWalletAddress();
  const [overview, setOverview] = useState<WalletOverview | null>(null);
  const [status, setStatus] = useState("Reading live wallet balance...");

  useEffect(() => {
    if (!getAuthToken() || !walletAddress) {
      setStatus("Wallet connected. Balance will appear after your session refreshes.");
      return;
    }

    let isMounted = true;
    getWalletOverview(walletAddress)
      .then((response) => {
        if (!isMounted) return;
        setOverview(response);
        setStatus("");
      })
      .catch((error) => {
        if (!isMounted) return;
        setStatus(error instanceof Error ? error.message : "Could not read live balance.");
      });

    return () => {
      isMounted = false;
    };
  }, [walletAddress]);

  const balance = useMemo(() => {
    if (!overview) return "--";
    return overview.solBalance.toLocaleString(undefined, {
      maximumFractionDigits: 6,
    });
  }, [overview]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#fffdf9] text-[#11131f]">
      <StatusBar />
      <div className="absolute inset-x-0 top-0 h-72 rounded-b-[55%] bg-[#a983ea]" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/20 to-transparent" />

      <main className="relative z-10 flex min-h-screen flex-col px-6 pb-6 text-center">
        <div className="pt-14">
          <CatMark />
        </div>

        <section className="mt-28">
          <p className="text-7xl leading-none">🎉</p>
          <h1 className="mt-2 text-6xl font-extrabold tracking-normal">Hurray!</h1>
          <p className="mt-8 text-3xl font-extrabold">
            Your balance is <span className="text-[#a983ea]">{balance} SOL</span>
          </p>
          <p className="mx-auto mt-5 max-w-[300px] text-lg leading-7 text-[#6d6d76]">
            You can use your connected wallet to start collecting unique artwork from talented
            artists.
          </p>
          {status && <p className="mx-auto mt-4 max-w-[310px] text-xs text-[#8a7aa8]">{status}</p>}
        </section>

        <div className="mt-10 px-8">
          <PrimaryButton to="/explore" className="rounded-[2rem] border-4 border-[#16121f] bg-[#a983ea] py-5 text-xl shadow-[0_5px_0_#16121f]">
            Browse Collection
          </PrimaryButton>
        </div>
        <Link to="/onboarding/styles" className="mt-7 text-2xl font-extrabold text-[#a983ea]">
          Skip
        </Link>

        <ArtCelebration />
      </main>
    </div>
  );
}

function CatMark() {
  return (
    <div className="mx-auto h-12 w-12 text-white">
      <svg viewBox="0 0 48 48" aria-hidden="true" className="h-full w-full">
        <path
          fill="currentColor"
          d="M11 31c0-10 3-18 8-18l5 6 5-6c5 0 8 8 8 18 0 3-2 5-5 5-2 0-4-1-5-3h-6c-1 2-3 3-5 3-3 0-5-2-5-5Z"
        />
        <circle cx="19" cy="25" r="2" fill="#a983ea" />
        <circle cx="29" cy="25" r="2" fill="#a983ea" />
        <path
          d="M21 30c1 2 5 2 6 0"
          fill="none"
          stroke="#a983ea"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}

function ArtCelebration() {
  return (
    <div className="pointer-events-none relative mt-auto h-72">
      <Sparkle className="absolute left-[31%] top-20" />
      <Sparkle className="absolute right-[28%] top-24 scale-75 opacity-70" />
      <Sparkle className="absolute right-4 top-4 scale-75" />
      <Sparkle className="absolute left-[22%] bottom-20 scale-75" />
      <ArtTile className="absolute left-0 top-2 -rotate-12" variant="sun" />
      <ArtTile className="absolute right-1 top-6 rotate-12" variant="portrait" />
      <ArtTile className="absolute left-1 bottom-9 -rotate-12" variant="vase" />
      <ArtTile className="absolute right-5 bottom-10 rotate-12" variant="abstract" />
      <div className="absolute inset-x-0 bottom-[-74px] mx-auto h-64 w-72 rounded-t-[48%] bg-[#a983ea] shadow-[inset_-18px_22px_28px_rgba(255,255,255,0.18)]">
        <div className="absolute -top-6 left-12 h-24 w-24 -rotate-12 rounded-t-[70%] bg-[#a983ea]" />
        <div className="absolute -top-6 right-12 h-24 w-24 rotate-12 rounded-t-[70%] bg-[#a983ea]" />
        <div className="absolute left-16 top-24 h-11 w-11 rounded-full bg-[#171521]" />
        <div className="absolute right-16 top-24 h-11 w-11 rounded-full bg-[#171521]" />
        <div className="absolute left-1/2 top-36 h-7 w-9 -translate-x-1/2 rounded-b-full border-b-[10px] border-l-[10px] border-r-[10px] border-[#171521]" />
      </div>
    </div>
  );
}

function Sparkle({ className = "" }: { className?: string }) {
  return <div className={`h-5 w-5 rotate-45 rounded-[4px] bg-[#a983ea] ${className}`} />;
}

function ArtTile({ className = "", variant }: { className?: string; variant: string }) {
  return (
    <div className={`h-28 w-24 rounded-2xl bg-white p-2 shadow-[0_6px_16px_rgba(58,42,92,0.18)] ${className}`}>
      <div className="relative h-full w-full overflow-hidden rounded-xl bg-[#fff0df]">
        {variant === "sun" && (
          <>
            <div className="absolute bottom-0 h-14 w-full bg-[#5f41a8]" />
            <div className="absolute bottom-4 h-10 w-full rounded-t-[45%] bg-[#8f69dd]" />
            <div className="absolute right-4 top-4 h-7 w-7 rounded-full bg-[#f6aa2f]" />
          </>
        )}
        {variant === "portrait" && (
          <>
            <div className="absolute bottom-0 right-0 h-24 w-14 rounded-t-full bg-[#171521]" />
            <div className="absolute bottom-0 left-5 h-20 w-14 rounded-t-full bg-[#a983ea]" />
          </>
        )}
        {variant === "vase" && (
          <>
            <div className="absolute bottom-3 left-9 h-11 w-8 rounded-b-xl rounded-t-full bg-[#8f69dd]" />
            <div className="absolute bottom-11 left-8 h-12 w-1 -rotate-12 bg-[#171521]" />
            <div className="absolute bottom-16 left-5 h-5 w-8 rounded-full bg-[#171521]" />
          </>
        )}
        {variant === "abstract" && (
          <>
            <div className="absolute left-5 top-5 h-12 w-12 rounded-full bg-[#7957ca]" />
            <div className="absolute bottom-0 left-1 h-8 w-12 rounded-t-full bg-[#ff854f]" />
            <div className="absolute bottom-0 right-0 h-11 w-12 rounded-tl-full bg-[#171521]" />
          </>
        )}
      </div>
    </div>
  );
}
