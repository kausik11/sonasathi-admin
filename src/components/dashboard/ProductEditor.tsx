"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { type Category, type GoldData, type GoldOverride, type Jeweller, type Product } from "../../services/dashboardDataService";
import { calculatePriceBreakdown, formatInr, getAppliedGoldRate, SUPPORTED_GOLD_PURITIES } from "../../utils/productPricing";
import ImageUploader from "../jewellery/ImageUploader";
import ImageGallery from "../jewellery/ImageGallery";
import PriceBreakdownTable from "../jewellery/PriceBreakdownTable";
import { getProductCategoryFields, type CategoryField } from "../../utils/productCategoryFields";

const newProductId = () => `product-${crypto.randomUUID()}`;
const blankProduct = (jewellerId: string): Product => ({
  id: newProductId(), jewellerId, name: "", category: "", purity: "22K", weight: 0, netGoldWeight: 0, actualPrice: 0,
  offerAmount: 0, fixedDiscount: 0, grossWeight: undefined, huid: "", huid2: "", stoneName: "", stoneDetails: "", stoneCharges: 0, productAttributes: {},
  makingChargePercentage: 15, makingChargeDiscountPercentage: 0, breakdownDiscount: 0, gstPercentage: 3, pricingMode: "manual",
  status: "draft", description: "", createdAt: new Date().toISOString(),
});

export default function ProductEditor({ product, jewellers, categories, gold, overrides, fixedJewellerId, onSave, onClose }: {
  product: Product | null; jewellers: Jeweller[]; categories: Category[]; gold: GoldData; overrides: GoldOverride[];
  fixedJewellerId?: string; onSave: (product: Product) => Promise<void> | void; onClose: () => void;
}) {
  const [draft, setDraft] = useState<Product>(() => product ? { ...product } : blankProduct(fixedJewellerId ?? jewellers[0]?.id ?? ""));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [savedNotice, setSavedNotice] = useState("");
  const [galleryVersion, setGalleryVersion] = useState(0);
  const [replaceImageId, setReplaceImageId] = useState<string | undefined>();
  const selectedCategories = useMemo(() => categories.filter((item) => item.active || item.name === draft.category), [categories, draft.category]);
  const categoryFields = getProductCategoryFields(draft.category);
  const appliedRate = getAppliedGoldRate(gold, overrides, draft.jewellerId, draft.purity);
  const price = calculatePriceBreakdown(draft, appliedRate);
  const inputClass = "mt-1.5 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#a98b52] focus:ring-2 focus:ring-[#d6b46b]/20";

  function update<K extends keyof Product>(key: K, value: Product[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateNumber(key: keyof Product, raw: string) {
    const value = raw === "" ? 0 : Number(raw);
    if (key === "weight") setDraft((current) => ({ ...current, weight: value, netGoldWeight: value }));
    else if (key === "netGoldWeight") setDraft((current) => ({ ...current, netGoldWeight: value, weight: value }));
    else setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateCategoryAttribute(key: string, raw: string, type: CategoryField["type"]) {
    const value = type === "number" && raw !== "" ? Number(raw) : raw;
    setDraft((current) => ({ ...current, productAttributes: { ...current.productAttributes, [key]: value } }));
  }

  function categoryFieldControl(field: CategoryField) {
    const value = draft.productAttributes?.[field.key];
    if (field.type === "select") return <label key={field.key} className="block text-xs font-semibold text-slate-600">{field.label}<select value={String(value ?? "")} onChange={(event) => updateCategoryAttribute(field.key, event.target.value, field.type)} className={inputClass}><option value="">Choose {field.label.toLocaleLowerCase()}</option>{field.options?.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
    return <label key={field.key} className="block text-xs font-semibold text-slate-600">{field.label}{field.unit ? ` (${field.unit})` : ""}<input type={field.type} step={field.step} value={String(value ?? "")} onChange={(event) => updateCategoryAttribute(field.key, event.target.value, field.type)} className={inputClass} /></label>;
  }

  async function submit() {
    setError(""); setSavedNotice("");
    const netWeight = Number(draft.netGoldWeight ?? draft.weight);
    const grossWeight = draft.grossWeight == null ? undefined : Number(draft.grossWeight);
    if (!draft.name.trim()) { setError("Jewellery name is required."); return; }
    if (!draft.category || !selectedCategories.some((item) => item.name === draft.category)) { setError("Choose an active admin-managed category."); return; }
    if (!Number.isFinite(netWeight) || netWeight <= 0 || (grossWeight !== undefined && (!Number.isFinite(grossWeight) || grossWeight < netWeight))) { setError("Enter a positive net weight. Gross weight must be greater than or equal to net weight."); return; }
    if ([draft.stoneCharges, draft.makingChargePercentage, draft.makingChargeDiscountPercentage, draft.breakdownDiscount, draft.gstPercentage].some((item) => !Number.isFinite(Number(item)) || Number(item) < 0) || draft.makingChargeDiscountPercentage! > 100) { setError("Enter non-negative prices and percentages. Making-charge discount cannot exceed 100%."); return; }
    if (draft.pricingMode === "manual" && (!Number.isFinite(Number(draft.actualPrice)) || draft.actualPrice < 0)) { setError("Actual price must be a valid non-negative amount."); return; }
    if (draft.fixedDiscount! > price.actualPrice) { setError("Fixed selling discount cannot exceed the actual price."); return; }
    setBusy(true);
    try {
      const next: Product = {
        ...draft, name: draft.name.trim(), weight: netWeight, netGoldWeight: netWeight, grossWeight,
        fixedDiscount: Number(draft.fixedDiscount ?? draft.offerAmount ?? 0), offerAmount: Number(draft.fixedDiscount ?? draft.offerAmount ?? 0),
        stoneCharges: Number(draft.stoneCharges ?? 0), makingChargePercentage: Number(draft.makingChargePercentage ?? 15),
        makingChargeDiscountPercentage: Number(draft.makingChargeDiscountPercentage ?? 0), breakdownDiscount: Number(draft.breakdownDiscount ?? 0),
        gstPercentage: Number(draft.gstPercentage ?? 3), actualPrice: price.actualPrice, goldRateSource: appliedRate.source,
        goldRateTimestamp: appliedRate.sourceTimestamp,
      };
      await onSave(next);
      setDraft(next);
      setSavedNotice(product ? "Product details saved. The displayed breakdown will follow current rates." : "Product saved. Add photos below; changes are kept in this browser.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Product could not be saved."); }
    finally { setBusy(false); }
  }

  function fieldControl({ label, field, type = "text", required = false, step }: { label: string; field: keyof Product; type?: string; required?: boolean; step?: string }) {
    return <label className="block text-xs font-semibold text-slate-600">{label}<input required={required} type={type} step={step} value={String(draft[field] ?? "")} onChange={(event) => type === "number" ? updateNumber(field, event.target.value) : update(field, event.target.value as Product[typeof field])} className={inputClass} /></label>;
  }

  return <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/45 p-3 sm:p-6">
    <section role="dialog" aria-modal="true" aria-label={product ? "Edit jewellery product" : "Add jewellery product"} className="mx-auto my-2 max-w-6xl overflow-hidden rounded-2xl bg-[#f8f7f3] shadow-2xl">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-[#9a773e]">Product catalogue</p><h2 className="mt-1 text-lg font-semibold text-slate-900">{product ? "Edit jewellery listing" : "Add jewellery listing"}</h2></div><button type="button" onClick={onClose} aria-label="Close editor" className="rounded-lg p-2 text-slate-500 hover:bg-gray-100"><X size={20} /></button></div>
      <div className="grid gap-5 p-4 sm:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(390px,0.9fr)]">
        <div className="space-y-5">
          <section className="rounded-xl border border-[#e8e4da] bg-white p-4"><h3 className="font-semibold">Basic information</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fixedJewellerId ? <div className="text-xs font-semibold text-slate-600">Jeweller<input readOnly value={jewellers.find((item) => item.id === draft.jewellerId)?.shop.shopName ?? "Your shop"} className={`${inputClass} bg-gray-50`} /></div> : <label className="block text-xs font-semibold text-slate-600">Jeweller<select value={draft.jewellerId} onChange={(event) => update("jewellerId", event.target.value)} className={inputClass}>{jewellers.map((item) => <option key={item.id} value={item.id}>{item.shop.shopName}</option>)}</select></label>}
            {fieldControl({ label: "Jewellery name", field: "name", required: true })}
            <label className="block text-xs font-semibold text-slate-600">Category<select required value={draft.category} onChange={(event) => update("category", event.target.value)} className={inputClass}><option value="">Choose category</option>{selectedCategories.map((item) => <option key={item.id} value={item.name}>{item.name}{!item.active ? " (inactive)" : ""}</option>)}</select></label>
            <label className="block text-xs font-semibold text-slate-600">Status<select value={draft.status} onChange={(event) => update("status", event.target.value as Product["status"])} className={inputClass}><option value="draft">Draft</option><option value="published">Published</option><option value="unpublished">Unpublished</option></select></label>
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Description<textarea rows={3} value={draft.description} onChange={(event) => update("description", event.target.value)} className={inputClass} /></label>
          </div></section>
          {categoryFields.length > 0 && <section className="rounded-xl border border-[#e8e4da] bg-white p-4"><h3 className="font-semibold">{draft.category} details</h3><p className="mt-1 text-xs text-slate-500">These fields are shown for this jewellery category.</p><div className="mt-4 grid gap-4 sm:grid-cols-2">{categoryFields.map(categoryFieldControl)}</div></section>}
          <section className="rounded-xl border border-[#e8e4da] bg-white p-4"><h3 className="font-semibold">Jewellery specifications</h3><div className="mt-4 grid gap-4 sm:grid-cols-2">
            {fieldControl({ label: "HUID", field: "huid" })}{fieldControl({ label: "HUID 2 (optional)", field: "huid2" })}
            <label className="block text-xs font-semibold text-slate-600">Gold purity<select value={draft.purity} onChange={(event) => update("purity", event.target.value)} className={inputClass}>{SUPPORTED_GOLD_PURITIES.map((purity) => <option key={purity}>{purity}</option>)}</select></label>
            {fieldControl({ label: "Gold net weight (g)", field: "netGoldWeight", type: "number", step: "0.001", required: true })}
            {fieldControl({ label: "Gross weight (g) (optional)", field: "grossWeight", type: "number", step: "0.001" })}
            {fieldControl({ label: "Stone name", field: "stoneName" })}{fieldControl({ label: "Stone charges (₹)", field: "stoneCharges", type: "number", step: "0.01" })}
            <label className="block text-xs font-semibold text-slate-600 sm:col-span-2">Stone details<textarea rows={2} value={draft.stoneDetails ?? ""} onChange={(event) => update("stoneDetails", event.target.value)} className={inputClass} /></label>
          </div></section>
          <section className="rounded-xl border border-[#e8e4da] bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-semibold">Selling price settings</h3><p className="mt-1 text-xs text-slate-500">Selling price and the transparent metal breakdown are independent in manual mode.</p></div><select value={draft.pricingMode ?? "manual"} onChange={(event) => update("pricingMode", event.target.value as "manual" | "breakdown")} className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="manual">Manual actual price</option><option value="breakdown">Derive from breakdown</option></select></div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{draft.pricingMode === "breakdown" ? <div className="text-xs font-semibold text-slate-600">Actual price (from breakdown)<p className="mt-2 rounded-lg bg-[#f8f5ed] px-3 py-2.5 text-sm font-semibold">{formatInr(price.actualPrice)}</p></div> : fieldControl({ label: "Actual price (₹)", field: "actualPrice", type: "number", step: "0.01", required: true })}{fieldControl({ label: "Fixed selling discount (₹)", field: "fixedDiscount", type: "number", step: "0.01" })}
              {fieldControl({ label: "Making charge (%)", field: "makingChargePercentage", type: "number", step: "0.01" })}{fieldControl({ label: "Making-charge discount (%)", field: "makingChargeDiscountPercentage", type: "number", step: "0.01" })}
              {fieldControl({ label: "Breakdown discount (₹, separate)", field: "breakdownDiscount", type: "number", step: "0.01" })}{fieldControl({ label: "GST (%)", field: "gstPercentage", type: "number", step: "0.01" })}
            </div><p className="mt-3 text-xs leading-5 text-amber-800">GST is configurable and shown for estimation only. Confirm tax applicability for each transaction before billing. Fixed selling discount is applied once to actual price; breakdown discount is a separate subtotal adjustment.</p>
          </section>
          <div className="flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm">Cancel</button><button type="button" disabled={busy} onClick={() => void submit()} className="rounded-lg bg-[#20382e] px-4 py-2.5 text-sm font-medium text-white disabled:opacity-50">{busy ? "Saving…" : product ? "Save product" : "Save product to add photos"}</button></div>
          {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}{savedNotice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{savedNotice}</p>}
        </div>
        <div className="space-y-5">
          <PriceBreakdownTable product={draft} rate={appliedRate} />
          <section className="rounded-xl border border-[#e8e4da] bg-white p-4"><div><h3 className="font-semibold">Product images</h3><p className="mt-1 text-xs text-slate-500">Images attach to this jeweller and listing and are stored in this browser.</p></div>{product ? <div className="mt-4 space-y-4"><ImageUploader productId={draft.id} jewellerId={draft.jewellerId} replaceImageId={replaceImageId} onSaved={() => { setReplaceImageId(undefined); setGalleryVersion((version) => version + 1); setSavedNotice("Photo saved to this listing."); }} /><ImageGallery key={`${draft.id}:${galleryVersion}`} productId={draft.id} jewellerId={draft.jewellerId} onReplace={setReplaceImageId} /></div> : <p className="mt-4 rounded-lg bg-gray-50 p-3 text-sm text-slate-500">Save the product details first. The editor will stay open so you can then add multiple photos.</p>}</section>
          <p className="text-xs leading-5 text-slate-500">Gold rates are recalculated using the owning jeweller’s active purity-specific override. Other purities use a clearly marked proportional estimate from the configured 24K reference.</p>
        </div>
      </div>
    </section>
  </div>;
}
