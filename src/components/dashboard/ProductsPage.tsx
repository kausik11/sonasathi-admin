"use client";

import { useMemo, useState } from "react";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { getDemoSession } from "../../services/demoSession";
import { deleteProduct, saveProduct, type Product } from "../../services/dashboardDataService";
import { useDashboardData } from "../../hooks/useDashboardData";
import { ActionButton, EmptyState, Modal, Panel, SearchInput, Table, type FormField, type FormValues } from "./SharedUI";
import ProductThumbnail from "./ProductThumbnail";

const makeId = () => `product-${crypto.randomUUID()}`;
const money = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

export default function ProductsPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const currentJeweller = role === "jeweller" ? getDemoSession()?.id : undefined;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editor, setEditor] = useState<Product | null | false>(false);
  const [detail, setDetail] = useState<Product | null>(null);
  const [toast, setToast] = useState("");
  const products = useMemo(() => (data?.products ?? []).filter((product) => (!currentJeweller || product.jewellerId === currentJeweller) && (statusFilter === "all" || product.status === statusFilter) && `${product.name} ${product.category} ${product.id}`.toLowerCase().includes(search.toLowerCase())), [data, currentJeweller, statusFilter, search]);
  const fields: FormField[] = [
    ...(role === "admin" ? [{ key: "jewellerId", label: "Jeweller", type: "select" as const, required: true, options: (data?.jewellers ?? []).map((item) => ({ label: item.shop.shopName, value: item.id })) }] : []),
    { key: "name", label: "Product name", required: true },
    { key: "category", label: "Category", type: "select", required: true, options: (data?.categories ?? []).map((item) => ({ label: item.name, value: item.name })) },
    { key: "purity", label: "Metal purity", type: "select", required: true, options: ["24K", "22K", "20K", "18K", "14K", "Silver", "Platinum"].map((value) => ({ label: value, value })) },
    { key: "weight", label: "Weight (g)", type: "number", step: "0.01", required: true },
    { key: "actualPrice", label: "Actual price (₹)", type: "number", required: true },
    { key: "offerAmount", label: "Offer amount (₹)", type: "number", required: true },
    { key: "status", label: "Listing status", type: "select", options: [{ label: "Draft", value: "draft" }, { label: "Published", value: "published" }] },
    { key: "description", label: "Description", type: "textarea" },
  ];
  function beginEdit(record: Product | null) { setEditor(record); }
  function save(values: FormValues) {
    if (!data) return;
    const current = editor || null;
    const owner = currentJeweller ?? String(values.jewellerId);
    const next: Product = { id: current?.id ?? makeId(), jewellerId: owner, name: String(values.name).trim(), category: String(values.category), purity: String(values.purity), weight: Number(values.weight), actualPrice: Number(values.actualPrice), offerAmount: Number(values.offerAmount), status: String(values.status) === "published" ? "published" : "draft", description: String(values.description ?? ""), createdAt: current?.createdAt ?? new Date().toISOString() };
    if (!next.name || !Number.isFinite(next.weight) || next.weight <= 0 || !Number.isFinite(next.actualPrice) || next.actualPrice < 0 || !Number.isFinite(next.offerAmount) || next.offerAmount < 0 || next.offerAmount > next.actualPrice) throw new Error("Enter a valid name, positive weight, and offer no greater than the actual price.");
    saveProduct(next); setEditor(false); reload(); setToast(current ? "Product updated." : "Product added.");
  }
  async function remove(product: Product) {
    if (!window.confirm(`Delete “${product.name}” and its saved images?`)) return;
    try { await deleteProduct(product.id, product.jewellerId); reload(); setToast("Product and its images deleted."); }
    catch (reason) { setToast(reason instanceof Error ? reason.message : "The product could not be deleted."); }
  }
  function toggleStatus(product: Product) {
    saveProduct({ ...product, status: product.status === "published" ? "draft" : "published" }); reload(); setToast(product.status === "published" ? "Product unpublished." : "Product published.");
  }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading jewellery listings…</p>;
  const initialValues: FormValues = editor ? { jewellerId: editor.jewellerId, name: editor.name, category: editor.category, purity: editor.purity, weight: editor.weight, actualPrice: editor.actualPrice, offerAmount: editor.offerAmount, status: editor.status, description: editor.description } : { jewellerId: currentJeweller ?? data.jewellers[0]?.id ?? "", name: "", category: data.categories[0]?.name ?? "", purity: "22K", weight: 0, actualPrice: 0, offerAmount: 0, status: "draft", description: "" };
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Catalogue</p><h1 className="mt-1 text-2xl font-semibold">Jewellery Products</h1><p className="mt-1 text-sm text-slate-500">Manage listing details, prices and publishing status.</p></div><ActionButton onClick={() => beginEdit(null)}><Plus size={16} /> Add product</ActionButton></div>
    <Panel title={`${products.length} listings`} description="Published and draft products are saved in this browser.">
      <div className="mb-4 flex flex-wrap gap-3"><SearchInput value={search} onChange={setSearch} placeholder="Search product name or ID…" /><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
      {products.length ? <Table headings={["Image", "Product", "Jeweller", "Category", "Purity", "Weight", "Actual", "Offer", "Final price", "Status", "Actions"]}>{products.map((product) => { const owner = data.jewellers.find((item) => item.id === product.jewellerId); const finalPrice = Math.max(0, product.actualPrice - product.offerAmount); return <tr key={product.id}><td className="px-3 py-3"><ProductThumbnail productId={product.id} jewellerId={product.jewellerId} /></td><td className="px-3 py-3"><p className="font-medium text-slate-800">{product.name}</p><p className="text-[11px] text-slate-400">{product.id}</p></td><td className="px-3 py-3">{owner?.shop.shopName ?? "Unknown"}</td><td className="px-3 py-3">{product.category}</td><td className="px-3 py-3">{product.purity}</td><td className="px-3 py-3">{product.weight} g</td><td className="px-3 py-3">{money(product.actualPrice)}</td><td className="px-3 py-3">{money(product.offerAmount)}</td><td className="px-3 py-3 font-medium">{money(finalPrice)}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${product.status === "published" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{product.status}</span></td><td className="px-3 py-3"><div className="flex gap-1"><button title="View details" onClick={() => setDetail(product)} className="rounded p-1.5 text-slate-500 hover:bg-gray-100"><Eye size={15} /></button><button title="Edit" onClick={() => beginEdit(product)} className="rounded p-1.5 text-slate-500 hover:bg-gray-100"><Pencil size={15} /></button><button title={product.status === "published" ? "Unpublish" : "Publish"} onClick={() => toggleStatus(product)} className="rounded px-2 text-xs text-[#795f32] hover:bg-amber-50">{product.status === "published" ? "Unpublish" : "Publish"}</button><button title="Delete" onClick={() => void remove(product)} className="rounded p-1.5 text-red-600 hover:bg-red-50"><Trash2 size={15} /></button></div></td></tr>; })}</Table> : <EmptyState message="No jewellery listings match your filters." />}
    </Panel>
    {editor !== false && <Modal title={editor ? "Edit jewellery product" : "Add jewellery product"} fields={fields} initial={initialValues} onClose={() => setEditor(false)} onSave={save} />}
    {detail && <div className="fixed inset-0 z-[70] grid place-items-center bg-black/40 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}><div role="dialog" aria-modal="true" className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"><div className="flex items-start justify-between"><div><p className="text-xs text-slate-500">{detail.id}</p><h2 className="mt-1 text-xl font-semibold">{detail.name}</h2></div><button onClick={() => setDetail(null)} className="text-slate-500">×</button></div><p className="mt-4 text-sm leading-6 text-slate-600">{detail.description || "No description."}</p><dl className="mt-4 grid grid-cols-2 gap-3 text-sm">{[["Jeweller", data.jewellers.find((item) => item.id === detail.jewellerId)?.shop.shopName], ["Category", detail.category], ["Purity", detail.purity], ["Weight", `${detail.weight} g`], ["Actual price", money(detail.actualPrice)], ["Final price", money(detail.actualPrice - detail.offerAmount)]].map(([key, value]) => <div key={key}><dt className="text-xs text-slate-500">{key}</dt><dd className="mt-1 font-medium">{value}</dd></div>)}</dl></div></div>}
    {toast && <div className="fixed bottom-5 right-5 z-[80] max-w-sm rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button onClick={() => setToast("")} className="ml-4">×</button></div>}
  </div>;
}
