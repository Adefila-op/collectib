import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { MobileShell } from "@/components/mobile-shell";
import { ArtistCollection, getArtistCollections } from "@/lib/api";

export const Route = createFileRoute("/collections")({
  component: Collections,
});

function Collections() {
  const [collections, setCollections] = useState<ArtistCollection[]>([]);
  const [status, setStatus] = useState("Loading collections...");

  useEffect(() => {
    let cancelled = false;
    getArtistCollections()
      .then(({ collections }) => {
        if (cancelled) return;
        setCollections(collections);
        setStatus(collections.length ? "" : "No admin collections yet.");
      })
      .catch((error) => {
        if (!cancelled) {
          setStatus(error instanceof Error ? error.message : "Could not load collections.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <MobileShell>
      <div className="px-5 pt-2 flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Collections</h1>
        <Link to="/admin" className="text-sm text-primary font-semibold">
          Admin
        </Link>
      </div>
      <p className="px-5 text-sm text-muted-foreground mt-1">Owned physical assets</p>
      <div className="grid grid-cols-2 gap-3 px-5 mt-4">
        {status && <p className="col-span-2 text-sm text-muted-foreground">{status}</p>}
        {collections.map((collection, index) => (
          <Link key={collection.id} to="/collection/$id" params={{ id: collection.id }}>
            <CollectionCover index={index} />
            <p className="font-semibold text-sm mt-2">{collection.title}</p>
            <p className="text-xs text-muted-foreground">
              {collection.artworks.length} owned asset{collection.artworks.length === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </MobileShell>
  );
}

function CollectionCover({ index }: { index: number }) {
  const colors = ["#EDE7FF", "#FFE9DC", "#E8F4EA", "#F7E6EF"];
  return (
    <div className="rounded-2xl overflow-hidden h-32">
      <svg viewBox="0 0 160 130" className="w-full h-full">
        <rect width="160" height="130" fill={colors[index % colors.length]} />
        <ellipse cx="58" cy="65" rx="34" ry="45" fill="#1A1A1A" opacity="0.85" />
        <circle cx="116" cy="42" r="22" fill="#F5A524" opacity="0.85" />
        <rect x="98" y="80" width="42" height="28" rx="8" fill="#126B5A" opacity="0.86" />
      </svg>
    </div>
  );
}
