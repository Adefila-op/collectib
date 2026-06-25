import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  component: Verify,
});

function Verify() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="flex-1 px-8 text-center">
        <div className="w-20 h-20 mx-auto rounded-full bg-primary-soft text-primary flex items-center justify-center">
          <Mail size={32} />
        </div>
        <h1 className="text-2xl font-extrabold mt-5">Check your inbox</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
          We sent a verification link to{" "}
          <span className="font-semibold text-foreground">tima@gmail.com</span>. Tap the link to
          activate your account.
        </p>
        <p className="text-xs text-muted-foreground mt-6">
          Didn't get it? <span className="text-primary font-semibold">Resend email</span>
        </p>
      </div>
      <div className="p-6">
        <PrimaryButton to="/home">Continue</PrimaryButton>
      </div>
    </div>
  );
}
