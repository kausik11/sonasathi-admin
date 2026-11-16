"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { compressImage } from "../../utils/compressImage";
import { getImageStorageMode, saveJewelleryImage } from "../../services/imageStorageService";

type Props = {
  productId: string;
  jewellerId: string;
  onSaved?: () => void;
  replaceImageId?: string;
};

export default function ImageUploader({ productId, jewellerId, onSaved, replaceImageId }: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const previewUrls = useRef<string[]>([]);
  useEffect(() => () => previewUrls.current.forEach((url) => URL.revokeObjectURL(url)), []);

  function selectFiles(selected: File[]) {
    previewUrls.current.forEach((url) => URL.revokeObjectURL(url));
    const urls = selected.map((selectedFile) => URL.createObjectURL(selectedFile));
    previewUrls.current = urls;
    setPreviews(urls);
    setFiles(selected);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!files.length) { setError("Select an image to continue."); return; }
    setBusy(true);
    setError("");
    try {
      for (const [index, file] of files.entries()) {
        const blob = await compressImage(file);
        await saveJewelleryImage({ productId, jewellerId, name: file.name, blob, replaceId: index === 0 ? replaceImageId : undefined });
      }
      selectFiles([]);
      onSaved?.();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The image could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <label className="block text-sm font-medium">
        {replaceImageId ? "Replacement image" : "Jewellery images (select one or more)"}
        <input
          className="mt-2 block w-full rounded-md border border-gray-300 p-2 text-sm"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple={!replaceImageId}
          onChange={(event) => { selectFiles(Array.from(event.target.files ?? [])); setError(""); }}
        />
      </label>
      {previews.map((preview, index) => <Image key={preview} src={preview} alt={`Selected jewellery preview ${index + 1}`} width={480} height={320} unoptimized className="inline-block max-h-64 max-w-full rounded object-contain" />)}
      {getImageStorageMode() === "localstorage" && <p className="text-xs text-amber-700">Demo storage uses browser quota. IndexedDB is the recommended option.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <button disabled={busy || !files.length} className="rounded-md bg-gray-900 px-4 py-2 text-sm text-white disabled:opacity-50">
        {busy ? `Saving ${files.length > 1 ? `${files.length} photos` : "photo"}…` : replaceImageId ? "Replace image" : files.length > 1 ? `Save ${files.length} photos` : "Save image"}
      </button>
    </form>
  );
}
