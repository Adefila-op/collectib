import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { StatusBar, TopBar } from "@/components/mobile-shell";
import { BlobArt, PrimaryButton } from "@/components/art-ui";
import { createArtwork, uploadArtworkImage } from "@/lib/api";

export const Route = createFileRoute("/sell/create")({
  component: Create,
});

function Create() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priceAmount, setPriceAmount] = useState("100");
  const [priceCurrency, setPriceCurrency] = useState<"USD" | "USDC" | "SOL">("USD");
  const [tokenMint, setTokenMint] = useState("");
  const [metadataUri, setMetadataUri] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [status, setStatus] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const selectImage = (file: File | null) => {
    setImageFile(file);
    setPreviewUrl(file ? URL.createObjectURL(file) : "");
  };

  const submit = async () => {
    if (isBusy) return;
    setIsBusy(true);
    setStatus("");
    try {
      setStatus(imageFile ? "Uploading artwork image..." : "Creating listing...");
      const uploaded = imageFile ? await uploadArtworkImage(imageFile) : null;
      const finalImageUrl = uploaded?.imageUrl || imageUrl || undefined;
      setStatus("Saving artwork details...");
      const created = await createArtwork({
        title,
        description: description || undefined,
        priceAmount: Number(priceAmount),
        priceCurrency,
        tokenMint: tokenMint || undefined,
        metadataUri: metadataUri || undefined,
        imageUrl: finalImageUrl,
      });
      navigate({ to: "/artwork/$id", params: { id: created.artwork.id } });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Could not create listing.");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <StatusBar />
      <TopBar title="Create Listing" />
      <div className="px-5">
        <div className="rounded-3xl overflow-hidden aspect-square bg-muted">
          {previewUrl || imageUrl ? (
            <img src={previewUrl || imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <BlobArt variant={1} className="w-full h-full" />
          )}
        </div>

        <div className="mt-5 space-y-3">
          <Field label="Title" value={title} onChange={setTitle} placeholder="Artwork title" />
          <Field
            label="Description"
            value={description}
            onChange={setDescription}
            placeholder="Short description"
          />
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <Field label="Price" value={priceAmount} onChange={setPriceAmount} type="number" />
            <label className="rounded-2xl bg-secondary px-4 py-3">
              <p className="text-[11px] text-muted-foreground">Currency</p>
              <select
                value={priceCurrency}
                onChange={(event) => setPriceCurrency(event.target.value as typeof priceCurrency)}
                className="w-full bg-transparent outline-none text-sm font-semibold"
              >
                <option>USD</option>
                <option>USDC</option>
                <option>SOL</option>
              </select>
            </label>
          </div>
          <Field
            label="Image URL"
            value={imageUrl}
            onChange={setImageUrl}
            placeholder="https://..."
          />
          <label className="block rounded-2xl bg-secondary px-4 py-3">
            <p className="text-[11px] text-muted-foreground">Upload image</p>
            <input
              type="file"
              accept="image/*"
              onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
              className="mt-2 w-full text-xs font-medium"
            />
          </label>
          <Field label="Token mint" value={tokenMint} onChange={setTokenMint} />
          <Field label="Metadata URI" value={metadataUri} onChange={setMetadataUri} />
        </div>
        {status && (
          <p className="mt-4 text-sm text-muted-foreground" role="status">
            {status}
          </p>
        )}
      </div>
      <div className="fixed bottom-0 inset-x-0 max-w-[440px] mx-auto bg-surface border-t border-border p-4">
        <PrimaryButton onClick={submit} className={isBusy ? "opacity-60" : ""}>
          {isBusy ? "Listing..." : "List Artwork"}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block rounded-2xl bg-secondary px-4 py-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent outline-none text-sm font-semibold"
      />
    </label>
  );
}
