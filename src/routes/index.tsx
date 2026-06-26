import { createFileRoute, Link } from "@tanstack/react-router";
import { StatusBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/")({
  component: Welcome,
});

function Welcome() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <StatusBar />
      <div className="flex-1 flex flex-col px-6 pb-10">
        <div className="flex-1 flex items-center justify-center">
          <video
            src="/assets/app-logo-splash.mp4"
            className="max-h-[68vh] w-full max-w-[360px] object-contain"
            autoPlay
            muted
            loop
            playsInline
            aria-label="Collectibles"
          />
        </div>
        <PrimaryButton to="/auth">Get started</PrimaryButton>
        <p className="text-center mt-4 text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link to="/auth" className="text-primary font-semibold">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
