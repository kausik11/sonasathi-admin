"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import {
  deleteJewelleryImage,
  getJewelleryImageUrl,
  listJewelleryImages,
  updateJewelleryImages,
  type JewelleryImage,
} from "../../services/imageStorageService";

type Props = { productId: string; jewellerId: string; onChange?: () => void; onReplace?: (imageId: string) => void };
type GalleryItem = JewelleryImage & { url: string };

export default function ImageGallery({ productId, jewellerId, onChange, onReplace }: Props) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    const next: GalleryItem[] = [];
    try {
      for (const image of listJewelleryImages(productId, jewellerId)) {
        const url = await getJewelleryImageUrl(image.id);
        if (url) next.push({ ...image, url });
      }
      setItems((previous) => {
        previous.forEach((item) => { if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url); });
        return next;
      });
    } catch (reason) {
      next.forEach((item) => { if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url); });
      setError(reason instanceof Error ? reason.message : "Images could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [productId, jewellerId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => () => items.forEach((item) => { if (item.url.startsWith("blob:")) URL.revokeObjectURL(item.url); }), [items]);

  async function commit(next: GalleryItem[], primaryId: string) {
    try {
      await updateJewelleryImages(productId, jewellerId, next.map((item) => item.id), primaryId);
      await refresh();
      onChange?.();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image changes could not be saved."); }
  }

  async function remove(item: GalleryItem) {
    try {
      await deleteJewelleryImage(item.id, jewellerId);
      await refresh();
      onChange?.();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Image could not be removed."); }
  }

  if (loading) return <p role="status" className="text-sm text-gray-500">Loading images…</p>;
  return (
    <section aria-label="Jewellery images" className="space-y-3">
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!items.length && <p className="text-sm text-gray-500">No images saved for this listing.</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((item, index) => (
          <article key={item.id} className="space-y-2 rounded border border-gray-200 p-2">
            <Image src={item.url} alt={item.name} width={480} height={480} unoptimized className="aspect-square w-full rounded object-cover" />
            <p className="truncate text-xs">{item.name}{item.isPrimary ? " · Primary" : ""}</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {!item.isPrimary && <button type="button" onClick={() => void commit(items, item.id)}>Set primary</button>}
              {onReplace && <button type="button" onClick={() => onReplace(item.id)}>Replace</button>}
              <button type="button" disabled={index === 0} onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; void commit(next, items.find((entry) => entry.isPrimary)?.id ?? item.id); }}>Move up</button>
              <button type="button" disabled={index === items.length - 1} onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; void commit(next, items.find((entry) => entry.isPrimary)?.id ?? item.id); }}>Move down</button>
              <button type="button" onClick={() => void remove(item)}>Remove</button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
