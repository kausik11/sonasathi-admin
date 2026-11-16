"use client";

import { useEffect, useState } from "react";
import JewelleryImageManager from "../jewellery/JewelleryImageManager";
import { getDemoSession } from "../../services/demoSession";
import { getDashboardData, type DemoData } from "../../services/dashboardDataService";
import { listAllJewelleryImages } from "../../services/imageStorageService";

export default function ProductImagesPage({ role }: { role: "admin" | "jeweller" }) {
  const [data, setData] = useState<(DemoData & { legacyImageProducts?: DemoData["products"] }) | null>(null);
  const [jewellerId, setJewellerId] = useState<string | undefined>();
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const session = getDemoSession();
        const next = getDashboardData();
        const known = new Set(next.products.map((product) => `${product.jewellerId}:${product.id}`));
        const legacyImageProducts = [...new Map(listAllJewelleryImages().filter((image) => !known.has(`${image.jewellerId}:${image.productId}`)).map((image) => [`${image.jewellerId}:${image.productId}`, {
          id: image.productId, jewellerId: image.jewellerId, name: `Existing image record · ${image.productId}`, category: "Legacy image record", purity: "—", weight: 0, actualPrice: 0, offerAmount: 0, status: "draft" as const, description: "This product ID was saved before the product catalogue was added.", createdAt: new Date(image.createdAt).toISOString(),
        }])).values()];
        setData({ ...next, legacyImageProducts });
        setJewellerId(role === "jeweller" ? session?.id : next.jewellers[0]?.id);
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Product images could not be loaded."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [role]);

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data || !jewellerId) return <p className="rounded-lg bg-white p-5 text-sm text-gray-500">Loading product image records…</p>;
  const products = [...data.products, ...(data.legacyImageProducts ?? [])].filter((product) => role === "admin" || product.jewellerId === jewellerId);
  const initialProduct = products.find((product) => product.jewellerId === jewellerId)?.id ?? "";
  return <JewelleryImageManager key={`${role}:${jewellerId}`} initialJewellerId={jewellerId} initialProductId={initialProduct} allowJewellerSelection={role === "admin"} productOptions={products} />;
}
