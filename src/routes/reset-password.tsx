import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { type FormEvent, useMemo, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { resetPassword, saveSession } from "@/lib/api";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = search.get("token") ?? "";
  const email = search.get("email") ?? "";
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState(token && email ? "" : "Reset link is missing details.");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting || !token || !email) return;

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await resetPassword({ email, token, password });
      saveSession(response.token, response.profile.wallet_address);
      navigate({ to: "/home" });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <TopBar title="Reset Password" />
      <div className="flex-1 px-6">
        <h1 className="text-3xl font-extrabold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Enter a new password for {email || "your account"}.
        </p>
        <div className="mt-8 rounded-2xl bg-secondary px-4 py-3">
          <p className="text-[11px] text-muted-foreground">New password</p>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 8 characters"
            minLength={8}
            required
            className="w-full bg-transparent outline-none text-sm font-medium"
          />
        </div>
        {status && <p className="mt-4 text-sm text-muted-foreground">{status}</p>}
      </div>
      <div className="p-6">
        <button
          type="submit"
          disabled={isSubmitting || !token || !email}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition disabled:opacity-60"
        >
          {isSubmitting ? "Saving..." : "Reset Password"}
        </button>
      </div>
    </form>
  );
}
