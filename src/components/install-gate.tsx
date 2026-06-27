import { Download, Share, Smartphone } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isMobileDevice() {
  return (
    window.matchMedia("(hover: none) and (pointer: coarse)").matches ||
    /Android|iPhone|iPad|iPod/i.test(window.navigator.userAgent)
  );
}

function isIosDevice() {
  return /iPhone|iPad|iPod/i.test(window.navigator.userAgent);
}

export function InstallGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [standalone, setStandalone] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const mobile = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isMobileDevice();
  }, []);

  const ios = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isIosDevice();
  }, []);

  useEffect(() => {
    const updateMode = () => {
      setStandalone(isStandalone());
      setReady(true);
    };

    updateMode();

    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener("change", updateMode);

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!isMobileDevice() || isStandalone()) return;
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setInstallPrompt(null);
      setStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      media.removeEventListener("change", updateMode);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  if (!ready) return null;
  if (!mobile || standalone) return <>{children}</>;

  const install = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  };

  return (
    <main className="min-h-screen bg-background px-6 py-8 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-[440px] flex-col">
        <div className="flex items-center justify-between gap-5">
          <div>
            <p className="text-sm font-semibold text-primary">collectibles</p>
            <h1 className="mt-2 text-3xl font-extrabold leading-tight">Save the app to continue</h1>
          </div>
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Smartphone size={24} />
          </div>
        </div>

        <div className="mt-10 rounded-[2rem] border border-border bg-surface p-5 shadow-sm">
          <div className="overflow-hidden rounded-[1.5rem] bg-secondary">
            <div className="h-40 bg-[linear-gradient(135deg,#8b5cf6,#34d399_55%,#f59e0b)]" />
            <div className="p-4">
              <p className="text-sm font-semibold">Collectibles works best from your home screen.</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Install it once, then open Collectibles from your phone like a native app.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 space-y-3">
          {installPrompt && (
            <button
              onClick={install}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-primary-foreground"
            >
              <Download size={18} />
              Save app
            </button>
          )}

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start gap-3">
              <Share className="mt-0.5 shrink-0 text-primary" size={18} />
              <div>
                <p className="text-sm font-semibold">
                  {ios ? "Tap Share, then Add to Home Screen" : "Use your browser menu to install"}
                </p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  After saving it, close this browser tab and launch Collectibles from the new app icon.
                </p>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-auto pt-8 text-center text-xs text-muted-foreground">
          This keeps the marketplace in a focused mobile app experience.
        </p>
      </div>
    </main>
  );
}
