import { createFileRoute } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { requestPasswordReset } from "@/lib/api";

export const Route = createFileRoute("/forgot-password")({
  component: Forgot,
});

function Forgot() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setStatus("");

    try {
      const response = await requestPasswordReset(email);
      setStatus(response.message);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="min-h-screen bg-background flex flex-col">
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
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            className="w-full bg-transparent outline-none text-sm font-medium"
          />
        </div>
        {status && <p className="mt-4 text-sm text-muted-foreground">{status}</p>}
      </div>
      <div className="p-6">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send Reset Link"}
        </button>
      </div>
    </form>
  );
}
