import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";
import { Shield } from "lucide-react";

export const Route = createFileRoute("/two-factor")({
  component: TwoFactor,
});

function TwoFactor() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Two-Factor Auth" />
      <div className="px-6 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-primary-soft text-primary flex items-center justify-center">
          <Shield size={28} />
        </div>
        <h1 className="text-xl font-extrabold mt-4">Secure your account</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the 6-digit code from your authenticator app.
        </p>
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <input
              key={i}
              maxLength={1}
              className="w-11 h-12 rounded-xl bg-secondary text-center font-bold outline-none focus:ring-2 focus:ring-primary"
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          Didn't receive a code? <span className="text-primary font-semibold">Resend</span>
        </p>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton to="/home">Verify</PrimaryButton>
      </div>
    </div>
  );
}
