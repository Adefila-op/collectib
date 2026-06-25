import { createFileRoute } from "@tanstack/react-router";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { PrimaryButton } from "@/components/art-ui";

export const Route = createFileRoute("/create-collection")({
  component: CreateCollection,
});

function CreateCollection() {
  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Create Collection" />
      <div className="px-5">
        <div className="rounded-3xl bg-accent h-44" />
        <button className="mt-3 text-xs text-primary font-semibold">Change cover</button>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-secondary px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Collection name</p>
            <input
              defaultValue="Lagos Moderns"
              className="w-full bg-transparent outline-none text-sm font-semibold"
            />
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Description</p>
            <textarea
              rows={3}
              defaultValue="A curated set of modern works from Lagos-based artists."
              className="w-full bg-transparent outline-none text-sm font-medium resize-none"
            />
          </div>
          <div className="rounded-2xl bg-secondary px-4 py-3 flex items-center justify-between">
            <p className="text-sm font-medium">Public collection</p>
            <div className="w-10 h-6 rounded-full bg-primary relative">
              <div className="absolute right-0.5 top-0.5 w-5 h-5 rounded-full bg-white" />
            </div>
          </div>
        </div>
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton to="/collections">Create Collection</PrimaryButton>
      </div>
    </div>
  );
}
