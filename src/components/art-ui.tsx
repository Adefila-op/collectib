import { Link } from "@tanstack/react-router";

export function BlobArt({ variant = 0, className = "" }: { variant?: number; className?: string }) {
  const palettes = [
    { bg: "#EDE7FF", shape: "#1A1A1A", accent: "#C9BCF5" },
    { bg: "#F5EFE6", shape: "#1A1A1A", accent: "#E8D9C2" },
    { bg: "#E8DFF5", shape: "#2D1B4E", accent: "#B8A4E8" },
    { bg: "#FFE9DC", shape: "#1A1A1A", accent: "#F2C19A" },
    { bg: "#1A1A1A", shape: "#C9BCF5", accent: "#8B7CC9" },
    { bg: "#F0EBFF", shape: "#1A1A1A", accent: "#D4C5F9" },
  ];
  const p = palettes[variant % palettes.length];
  const seed = variant * 37;
  return (
    <svg viewBox="0 0 200 200" className={className} preserveAspectRatio="xMidYMid slice">
      <rect width="200" height="200" fill={p.bg} />
      <ellipse
        cx={70 + (seed % 30)}
        cy={90 + (seed % 20)}
        rx="55"
        ry="65"
        fill={p.shape}
        opacity="0.95"
        transform={`rotate(${seed % 40} 100 100)`}
      />
      <ellipse
        cx={140 - (seed % 20)}
        cy={130 - (seed % 25)}
        rx="32"
        ry="40"
        fill={p.accent}
        opacity="0.85"
      />
      <circle cx="50" cy="160" r="8" fill={p.shape} opacity="0.3" />
    </svg>
  );
}

export function ArtworkCard({
  id = "1",
  title,
  artist,
  price,
  variant = 0,
  size = "md",
  imageUrl,
  assetStatus,
}: {
  id?: string;
  title: string;
  artist: string;
  price?: string;
  variant?: number;
  size?: "sm" | "md" | "lg";
  imageUrl?: string | null;
  assetStatus?: string;
}) {
  const dims = { sm: "h-28", md: "h-36", lg: "h-44" }[size];
  return (
    <Link to="/artwork/$id" params={{ id }} className="block group">
      <div className={`rounded-2xl overflow-hidden ${dims} bg-muted relative`}>
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <BlobArt variant={variant} className="w-full h-full" />
        )}
        <Link
          to="/favorites"
          onClick={(event) => event.stopPropagation()}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/80 backdrop-blur flex items-center justify-center text-[10px] font-bold"
          aria-label="Like"
        >
          Like
        </Link>
        {assetStatus === "owned" && (
          <span className="absolute bottom-2 left-2 rounded-full bg-black/75 px-2 py-1 text-[10px] font-bold text-white">
            Offer only
          </span>
        )}
      </div>
      <div className="mt-2 px-1">
        <p className="font-semibold text-sm leading-tight truncate">{title}</p>
        <p className="text-xs text-muted-foreground truncate">by {artist}</p>
        {price && <p className="text-sm font-semibold mt-0.5 text-primary">{price}</p>}
      </div>
    </Link>
  );
}

export function Chip({
  active,
  children,
  onClick,
}: {
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium border transition ${
        active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-surface text-foreground border-border"
      }`}
    >
      {children}
    </button>
  );
}

type ButtonLinkParams = Record<string, string>;
type ButtonLinkSearch = Record<string, string>;

export function PrimaryButton({
  children,
  onClick,
  to,
  params,
  search,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  to?: string;
  params?: ButtonLinkParams;
  search?: ButtonLinkSearch;
  className?: string;
}) {
  const cls = `w-full py-4 rounded-2xl bg-primary text-primary-foreground font-semibold text-base active:scale-[0.98] transition ${className}`;
  if (to)
    return (
      <Link to={to} params={params} search={search} className={cls + " block text-center"}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  to,
  params,
  search,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  to?: string;
  params?: ButtonLinkParams;
  search?: ButtonLinkSearch;
  onClick?: () => void;
  className?: string;
}) {
  const cls = `w-full py-4 rounded-2xl bg-secondary text-foreground font-semibold text-base ${className}`;
  if (to)
    return (
      <Link to={to} params={params} search={search} className={cls + " block text-center"}>
        {children}
      </Link>
    );
  return (
    <button onClick={onClick} className={cls}>
      {children}
    </button>
  );
}

export function SectionHeader({
  title,
  action,
  to,
}: {
  title: string;
  action?: string;
  to?: string;
}) {
  return (
    <div className="flex items-center justify-between px-5 mb-3">
      <h2 className="font-semibold text-base">{title}</h2>
      {action && to && (
        <Link to={to} className="text-xs text-primary font-medium">
          {action}
        </Link>
      )}
    </div>
  );
}
