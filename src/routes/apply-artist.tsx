import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";
import { useState } from "react";

export const Route = createFileRoute("/apply-artist")({
  component: Apply,
});

function Apply() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => navigate({ to: "/home" }), 1500);
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Apply as Artist" />
      <div className="px-5">
        <h1 className="text-2xl font-extrabold">Join our artist community</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Tell us about your practice. We review applications within 5 business days.
        </p>
        {submitted ? (
          <div className="mt-10 rounded-3xl bg-secondary p-6 text-center">
            <p className="text-2xl">🎉</p>
            <p className="font-bold mt-2">Application submitted!</p>
            <p className="text-sm text-muted-foreground mt-1">
              We'll review it within 5 business days.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {[
              ["Studio name", "Tima Studio"],
              ["Discipline", "Painting, mixed media"],
              ["Portfolio URL", "tima.art"],
              ["Years practicing", "6"],
            ].map(([l, v]) => (
              <div key={l} className="rounded-2xl bg-secondary px-4 py-3">
                <p className="text-[11px] text-muted-foreground">{l}</p>
                <input
                  defaultValue={v}
                  className="w-full bg-transparent outline-none text-sm font-medium"
                />
              </div>
            ))}
            <div className="rounded-2xl bg-secondary px-4 py-3">
              <p className="text-[11px] text-muted-foreground">About your work</p>
              <textarea
                rows={4}
                defaultValue="I explore themes of memory and identity through layered abstraction."
                className="w-full bg-transparent outline-none text-sm font-medium resize-none"
              />
            </div>
          </div>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton onClick={handleSubmit}>Submit Application</PrimaryButton>
      </div>
    </div>
  );
}
