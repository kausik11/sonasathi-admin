"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { getDemoSession } from "../../services/demoSession";
import { deleteProduct, saveProduct, type Product } from "../../services/dashboardDataService";
import { useDashboardData } from "../../hooks/useDashboardData";
import { ActionButton, EmptyState, Panel, SearchInput, Table } from "./SharedUI";
import ProductThumbnail from "./ProductThumbnail";
import ProductEditor from "./ProductEditor";
import PriceBreakdownTable from "../jewellery/PriceBreakdownTable";
import { calculatePriceBreakdown, getAppliedGoldRate, formatInr } from "../../utils/productPricing";

export default function ProductsPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const currentJeweller = role === "jeweller" ? getDemoSession()?.id : undefined;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editor, setEditor] = useState<Product | null | false>(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const products = useMemo(() => (data?.products ?? []).filter((p) => (!currentJeweller || p.jewellerId === currentJeweller) && (statusFilter === "all" || p.status === statusFilter) && `${p.name} ${p.category} ${p.id}`.toLowerCase().includes(search.toLowerCase())), [data, currentJeweller, statusFilter, search]);
  async function save(product: Product) {
    saveProduct(product);
    setEditor(product);
    reload();
    setToast("Product details saved.");
  }
  async function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}” and its saved images?`)) return;
    try { await deleteProduct(product.id, product.jewellerId); reload(); setToast("Product and its images deleted."); }
    catch (reason) { setToast(reason instanceof Error ? reason.message : "The product could not be deleted."); }
  }
  function toggleStatus(product: Product) {
    saveProduct({ ...product, status: product.status === "published" ? "unpublished" : "published" }); reload();
    setToast(product.status === "published" ? "Product unpublished." : "Product published.");
  }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading jewellery listings…</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Catalogue</p><h1 className="mt-1 text-2xl font-semibold">Jewellery Products</h1><p className="mt-1 text-sm text-slate-500">Manage listing details, transparent prices, photos and publishing status.</p></div><ActionButton onClick={() => setEditor(null)}><Plus size={16} /> Add product</ActionButton></div>
    <Panel title={`${products.length} listings`} description="Products and photos are saved in this browser.">
      <div className="mb-4 flex flex-wrap gap-3"><SearchInput value={search} onChange={setSearch} placeholder="Search product name or ID…" /><select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="unpublished">Unpublished</option></select></div>
      {products.length ? <Table headings={["Image", "Product", "Jeweller", "Category", "Purity", "Net weight", "Actual price", "Discount", "Selling price", "Status", "Actions"]}>{products.map((product) => {
        const rate = getAppliedGoldRate(data.gold, data.gold.overrides, product.jewellerId, product.purity);
        const breakdown = calculatePriceBreakdown(product, rate);
        const owner = data.jewellers.find((item) => item.id === product.jewellerId);
        return <tr key={product.id}><td className="px-3 py-3"><ProductThumbnail productId={product.id} jewellerId={product.jewellerId} /></td><td className="px-3 py-3"><p className="font-medium text-slate-800">{product.name}</p><p className="text-[11px] text-slate-400">{product.id}</p></td><td className="px-3 py-3">{owner?.shop.shopName ?? "Unknown"}</td><td className="px-3 py-3">{product.category}</td><td className="px-3 py-3">{product.purity}</td><td className="px-3 py-3">{product.netGoldWeight ?? product.weight} g</td><td className="px-3 py-3">{formatInr(breakdown.actualPrice)}</td><td className="px-3 py-3">{formatInr(breakdown.fixedDiscount)}</td><td className="px-3 py-3 font-medium">{formatInr(breakdown.discountedPrice)}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${product.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.status}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button title="View price breakdown" onClick={() => setDetail(product)} className="rounded p-1.5 text-slate-500 hover:bg-gray-100"><Eye size={15} /></button><button title="Edit" onClick={() => setEditor(product)} className="rounded p-1.5 text-slate-500 hover:bg-gray-100"><Pencil size={15} /></button><button title={product.status === "published" ? "Unpublish" : "Publish"} onClick={() => toggleStatus(product)} className="rounded px-2 text-xs text-[#795f32] hover:bg-amber-50">{product.status === "published" ? "Unpublish" : "Publish"}</button><button title="Delete" onClick={() => void remove(product)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></td></tr>;
      })}</Table> : <EmptyState message="No jewellery listings match your filters." />}
    </Panel>
    {editor !== false && <ProductEditor key="product-editor" product={editor || null} jewellers={data.jewellers} categories={data.categories} gold={data.gold} overrides={data.gold.overrides} fixedJewellerId={currentJeweller} onSave={save} onClose={() => setEditor(false)} />}
    {detail && <div className="fixed inset-0 z-[70] grid place-items-center overflow-y-auto bg-black/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) setDetail(null); }}><div role="dialog" aria-modal="true" className="my-auto w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"><div className="flex justify-between"><div><p className="text-xs text-slate-500">{detail.id}</p><h2 className="mt-1 text-xl font-semibold">{detail.name}</h2></div><button onClick={() => setDetail(null)} aria-label="Close">×</button></div><p className="mt-3 text-sm text-slate-600">{detail.description || "No description."}</p><div className="mt-5"><PriceBreakdownTable product={detail} rate={getAppliedGoldRate(data.gold, data.gold.overrides, detail.jewellerId, detail.purity)} /></div><p className="mt-3 text-xs text-slate-500"><a className="underline" href={`/products/${encodeURIComponent(detail.id)}`} target="_blank" rel="noreferrer">Open public product detail preview</a></p></div></div>}
    {toast && <div role="status" className="fixed bottom-5 right-5 z-[80] max-w-sm rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button onClick={() => setToast("")} className="ml-4" aria-label="Dismiss">×</button></div>}
  </div>;
}
