"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Gem } from "lucide-react";
import { getJewelleryImageUrl, listJewelleryImages } from "../../services/imageStorageService";

export default function ProductThumbnail({ productId, jewellerId }: { productId: string; jewellerId: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    const timer = window.setTimeout(async () => {
      try {
        const primary = listJewelleryImages(productId, jewellerId).find((image) => image.isPrimary) ?? listJewelleryImages(productId, jewellerId)[0];
        if (!primary) return;
        const result = await getJewelleryImageUrl(primary.id);
        if (!active || !result) return;
        objectUrl = result.startsWith("blob:") ? result : null;
        setUrl(result);
      } catch { setUrl(null); }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [productId, jewellerId]);
  return url ? <Image src={url} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-md object-cover" /> : <span className="grid h-10 w-10 place-items-center rounded-md bg-[#f5f0e3] text-[#a78a4e]"><Gem size={17} /></span>;
}
