import type { ReactNode } from "react";

interface LogoProps {
  className?: string;
  children?: ReactNode;
}

export function Logo({ className = "", children }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg
        width="48"
        height="48"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="block"
      >
        {/* Top-left: Dark brown */}
        <rect x="4" y="4" width="18" height="18" rx="4" fill="#1a0f0a" />
        {/* Top-right: Light gray */}
        <rect x="26" y="4" width="18" height="18" rx="4" fill="#d1d5db" />
        {/* Bottom-left: Light gray */}
        <rect x="4" y="26" width="18" height="18" rx="4" fill="#d1d5db" />
        {/* Bottom-right: Dark brown */}
        <rect x="26" y="26" width="18" height="18" rx="4" fill="#1a0f0a" />
      </svg>
      {children}
    </div>
  );
}
