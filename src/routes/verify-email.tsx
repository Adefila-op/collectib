import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";
import { resendVerificationEmail, saveSession, verifyEmailToken } from "@/lib/api";
import { Mail } from "lucide-react";

export const Route = createFileRoute("/verify-email")({
  component: Verify,
});

function Verify() {
  const navigate = useNavigate();
  const [status, setStatus] = useState(() => {
    const email = new URLSearchParams(window.location.search).get("email");
    return email
      ? `We sent a verification link to ${email}. Tap the link to activate your account.`
      : "Check your inbox for the verification link.";
  });
  const [isVerified, setIsVerified] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const email = new URLSearchParams(window.location.search).get("email") ?? "";

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const query = new URLSearchParams(window.location.search);
    const token = hash.get("access_token") ?? query.get("token");
    const refreshToken = hash.get("refresh_token") ?? undefined;
    if (!token) return;

    setStatus("Verifying your email...");
    verifyEmailToken(token, refreshToken)
      .then((response) => {
        saveSession(response.token, response.profile.wallet_address);
        setIsVerified(true);
        setStatus("Email verified. You're signed in.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Could not verify this email link.");
      });
  }, []);

  const resend = async () => {
    if (!email || isResending) return;
    setIsResending(true);
    setStatus("Sending another verification email...");
    try {
      const response = await resendVerificationEmail(email);
      setStatus(response.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not resend verification email.");
    } finally {
      setIsResending(false);
    }
  };

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
          {status}
        </p>
      </div>
      <div className="p-6">
        {!isVerified && email && (
          <button
            type="button"
            onClick={resend}
            disabled={isResending}
            className="mb-3 w-full py-3 rounded-2xl border border-border bg-surface text-sm font-semibold text-foreground disabled:opacity-60"
          >
            {isResending ? "Sending..." : "Resend verification email"}
          </button>
        )}
        <PrimaryButton onClick={() => navigate({ to: isVerified ? "/onboarding/role" : "/auth" })}>
          {isVerified ? "Continue" : "Back to sign in"}
        </PrimaryButton>
      </div>
    </div>
  );
}
