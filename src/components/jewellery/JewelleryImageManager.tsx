"use client";

import { useState } from "react";
import ImageUploader from "./ImageUploader";
import ImageGallery from "./ImageGallery";
import type { Product } from "../../services/dashboardDataService";

const demoJewellers = [
  { id: "jeweller-001", name: "Jeweller 1" },
  { id: "jeweller-002", name: "Jeweller 2" },
];

type Props = { initialJewellerId?: string; allowJewellerSelection?: boolean; initialProductId?: string; productOptions?: Product[] };

export default function JewelleryImageManager({ initialJewellerId = demoJewellers[0].id, allowJewellerSelection = true, initialProductId = "product-001", productOptions }: Props) {
  const [jewellerId, setJewellerId] = useState(initialJewellerId);
  const [productId, setProductId] = useState(initialProductId);
  const [galleryVersion, setGalleryVersion] = useState(0);
  const [replaceImageId, setReplaceImageId] = useState<string | undefined>();
  const availableProducts = productOptions?.filter((product) => product.jewellerId === jewellerId) ?? [];

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 p-6 sm:p-10">
      <header className="space-y-2">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-amber-700">Sonasathi · Local demo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Jewellery images</h1>
        <p className="max-w-2xl text-sm leading-6 text-gray-600">
          Add and organize listing photos. Images are saved in this browser profile and are not shared with other devices or the storefront.
        </p>
      </header>

      <section className={`grid gap-4 rounded-xl border border-gray-200 bg-white p-5 ${allowJewellerSelection ? "sm:grid-cols-2" : ""}`}>
        {allowJewellerSelection && <label className="space-y-2 text-sm font-medium text-gray-800">
          Demo jeweller
          <select
            className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2"
            value={jewellerId}
          onChange={(event) => { const nextJeweller = event.target.value; setJewellerId(nextJeweller); const firstProduct = productOptions?.find((product) => product.jewellerId === nextJeweller); setProductId(firstProduct?.id ?? ""); }}
          >
            {demoJewellers.map((jeweller) => <option key={jeweller.id} value={jeweller.id}>{jeweller.name}</option>)}
          </select>
        </label>}
        <label className="space-y-2 text-sm font-medium text-gray-800">
          Product ID
          {productOptions ? <select
            className="block w-full rounded-md border border-gray-300 px-3 py-2"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
          >
            <option value="">Choose a product</option>
            {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.id}</option>)}
          </select> : <input
            className="block w-full rounded-md border border-gray-300 px-3 py-2"
            value={productId}
            onChange={(event) => setProductId(event.target.value)}
            placeholder="Enter a product ID"
          />}
        </label>
      </section>

      {!productId.trim() ? (
        <p role="status" className="text-sm text-amber-800">Enter a product ID to manage its images.</p>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div>
              <h2 className="font-semibold text-gray-950">{replaceImageId ? "Replace photo" : "Upload photos"}</h2>
              <p className="mt-1 text-sm text-gray-600">JPG, PNG, WebP, or AVIF · up to 15 MB each</p>
            </div>
            <ImageUploader
              productId={productId.trim()}
              jewellerId={jewellerId}
              replaceImageId={replaceImageId}
              onSaved={() => { setReplaceImageId(undefined); setGalleryVersion((version) => version + 1); }}
            />
            {replaceImageId && <button type="button" className="text-sm text-gray-600 underline" onClick={() => setReplaceImageId(undefined)}>Cancel replacement</button>}
          </section>

          <section className="space-y-4 rounded-xl border border-gray-200 bg-white p-5">
            <div>
              <h2 className="font-semibold text-gray-950">Listing gallery</h2>
              <p className="mt-1 text-sm text-gray-600">Choose a primary photo, change the order, or remove images.</p>
            </div>
            <ImageGallery
              key={`${jewellerId}:${productId}:${galleryVersion}`}
              productId={productId.trim()}
              jewellerId={jewellerId}
              onReplace={setReplaceImageId}
            />
          </section>
        </div>
      )}
    </main>
  );
}
