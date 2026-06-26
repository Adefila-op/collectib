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
      <div className="flex-1 flex flex-col px-8 pt-16 pb-10">
        <div>
          <h1 className="text-[40px] leading-[1.05] font-extrabold tracking-tight">
            Everyone's
            <br />
            Art Portfolio
          </h1>
          <p className="mt-3 text-muted-foreground text-base">Discover, collect, invest.</p>
        </div>
        <div className="flex-1 flex items-center justify-center my-10">
          <Mascot />
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

function Mascot() {
  return (
    <svg viewBox="0 0 240 240" className="w-64 h-64">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#C9BCF5" />
          <stop offset="1" stopColor="#8B7CC9" />
        </linearGradient>
      </defs>
      <ellipse cx="120" cy="200" rx="70" ry="10" fill="#000" opacity="0.08" />
      <path
        d="M60 140 Q60 70 120 70 Q180 70 180 140 Q180 200 120 200 Q60 200 60 140 Z"
        fill="url(#g1)"
      />
      <path d="M75 100 L60 70 L95 90 Z" fill="url(#g1)" />
      <path d="M165 100 L180 70 L145 90 Z" fill="url(#g1)" />
      <circle cx="100" cy="135" r="6" fill="#1A1A1A" />
      <circle cx="140" cy="135" r="6" fill="#1A1A1A" />
      <path
        d="M105 160 Q120 170 135 160"
        stroke="#1A1A1A"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}
