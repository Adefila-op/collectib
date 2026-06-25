import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/forgot-password")({
  component: Forgot,
});

function Forgot() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar />
      <div className="flex-1 px-6">
        <h1 className="text-3xl font-extrabold">Reset password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter the email associated with your account and we'll send you a reset link.
        </p>
        <div className="mt-8 rounded-2xl bg-secondary px-4 py-3">
          <p className="text-[11px] text-muted-foreground">Email address</p>
          <input
            placeholder="tima@gmail.com"
            className="w-full bg-transparent outline-none text-sm font-medium"
          />
        </div>
      </div>
      <div className="p-6">
        <PrimaryButton to="/verify-email">Send Reset Link</PrimaryButton>
      </div>
    </div>
  );
}
