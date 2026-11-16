"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import Image from "next/image";
import { useEffect, useState } from "react";
import PriceBreakdownTable from "../../../src/components/jewellery/PriceBreakdownTable";
import { getDashboardData, type Product, listJewelleryImages, getJewelleryImageUrl } from "../../../src/services/dashboardDataService";
import type { GoldData, GoldOverride, Jeweller } from "../../../src/services/dashboardDataService";
import { getAppliedGoldRate } from "../../../src/utils/productPricing";
import { getProductCategoryFields } from "../../../src/utils/productCategoryFields";

function PublicProductContent() {
  const params = useParams<{ productId: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [shop, setShop] = useState<Jeweller | null>(null);
  const [rates, setRates] = useState<{ gold: GoldData; overrides: GoldOverride[] } | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true; const urls: string[] = [];
    const timer = window.setTimeout(() => { try {
      const data = getDashboardData(); const found = data.products.find((item) => item.id === params.productId && item.status === "published");
      const owner = found && data.jewellers.find((item) => item.id === found.jewellerId && item.status === "active" && item.shop.status !== "inactive");
      if (!found || !owner) { setError("This published product is not available."); return; }
      setProduct(found); setShop(owner); setRates({ gold: data.gold, overrides: data.gold.overrides });
      void Promise.all(listJewelleryImages(found.id, found.jewellerId).map(async (image) => getJewelleryImageUrl(image.id))).then((result) => {
        if (!active) { result.forEach((url) => { if (url?.startsWith("blob:")) URL.revokeObjectURL(url); }); return; }
        const valid = result.filter((url): url is string => Boolean(url)); urls.push(...valid.filter((url) => url.startsWith("blob:"))); setImages(valid);
      });
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Product data could not be loaded from this browser."); } }, 0);
    return () => { active = false; window.clearTimeout(timer); urls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [params.productId]);
  if (error) return <main className="grid min-h-screen place-items-center bg-[#f6f4ee] p-5"><p role="alert" className="rounded-xl bg-white p-6 text-slate-700">{error}</p></main>;
  if (!product || !shop || !rates) return <main className="grid min-h-screen place-items-center bg-[#f6f4ee] text-slate-500">Loading product…</main>;
  const appliedRate = getAppliedGoldRate(rates.gold, rates.overrides, product.jewellerId, product.purity);
  const categoryDetails = getProductCategoryFields(product.category).filter((field) => product.productAttributes?.[field.key] !== undefined && product.productAttributes[field.key] !== "");
  return <main className="min-h-screen bg-[#f6f4ee] px-4 py-10 text-[#26312b]"><div className="mx-auto max-w-5xl"><p className="text-xs font-semibold uppercase tracking-widest text-[#9a773e]">{shop.shop.shopName}</p><h1 className="mt-2 text-3xl font-semibold">{product.name}</h1><p className="mt-2 text-sm text-slate-600">{product.description}</p><div className="mt-7 grid gap-6 lg:grid-cols-2"><section className="grid grid-cols-2 gap-3">{images.length ? images.map((src, i) => <Image unoptimized width={640} height={640} key={`${src}-${i}`} src={src} alt={`${product.name} image ${i + 1}`} className="aspect-square w-full rounded-xl bg-white object-cover" />) : <div className="col-span-2 grid aspect-[4/3] place-items-center rounded-xl bg-white text-sm text-slate-400">No product images</div>}</section><section className="space-y-4">{categoryDetails.length > 0 && <section className="rounded-xl border border-[#e5dcc7] bg-white p-4"><h2 className="font-semibold">{product.category} details</h2><dl className="mt-3 grid grid-cols-2 gap-3 text-sm">{categoryDetails.map((field) => <div key={field.key}><dt className="text-xs text-slate-500">{field.label}</dt><dd className="mt-1 font-medium">{String(product.productAttributes?.[field.key])}{field.unit ? ` ${field.unit}` : ""}</dd></div>)}</dl></section>}<PriceBreakdownTable product={product} rate={appliedRate} /><p className="rounded-lg bg-white p-4 text-xs leading-5 text-slate-500">Browser demo listing. Prices, images and rates shown here are stored locally in this browser and are not automatically available to another device or a storefront hosted on a different origin. Confirm final tax and price with the jeweller.</p></section></div></div></main>;
}

export default function PublicProductPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#f6f4ee] text-slate-500">Loading product…</main>}><PublicProductContent /></Suspense>;
}
