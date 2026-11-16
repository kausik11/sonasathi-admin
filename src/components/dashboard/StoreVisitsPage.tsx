"use client";

import { useMemo, useState } from "react";
import { CalendarPlus, Plus } from "lucide-react";
import { getDemoSession } from "../../services/demoSession";
import { saveStoreVisit, updateVisitStatus, type StoreVisit, type VisitStatus } from "../../services/dashboardDataService";
import { useDashboardData } from "../../hooks/useDashboardData";
import { validateVisitAvailability } from "../../utils/visitAvailability";
import { ActionButton, EmptyState, Modal, Panel, SearchInput, Table, type FormField, type FormValues } from "./SharedUI";

const visitStatuses: VisitStatus[] = ["New", "Contacted", "Confirmed", "Visited", "Completed", "Cancelled"];
const id = () => `visit-${crypto.randomUUID()}`;

export default function StoreVisitsPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const jewellerId = role === "jeweller" ? getDemoSession()?.id : undefined;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [adding, setAdding] = useState(false);
  const [toast, setToast] = useState("");
  const rows = useMemo(() => (data?.visits ?? []).filter((visit) => (!jewellerId || visit.jewellerId === jewellerId) && (status === "all" || visit.status === status) && `${visit.customerName} ${visit.mobile} ${visit.email}`.toLowerCase().includes(search.toLowerCase())), [data, jewellerId, status, search]);
  const productOptions = (data?.products ?? []).filter((product) => !jewellerId || product.jewellerId === jewellerId).map((product) => ({ label: `${product.name} · ${data?.jewellers.find((item) => item.id === product.jewellerId)?.shop.shopName ?? "Shop"}`, value: product.id }));
  const ownerOptions = (data?.jewellers ?? []).filter((item) => !jewellerId || item.id === jewellerId).map((item) => ({ label: item.shop.shopName, value: item.id }));
  const fields: FormField[] = [
    { key: "customerName", label: "Customer name", required: true }, { key: "mobile", label: "Mobile number", type: "tel", required: true },
    { key: "email", label: "Email", type: "email" },
    ...(role === "admin" ? [{ key: "jewellerId", label: "Jeweller / shop", type: "select" as const, required: true, options: ownerOptions }] : []),
    { key: "productId", label: "Interested jewellery", type: "select", required: true, options: (values) => (data?.products ?? []).filter((product) => product.jewellerId === (jewellerId ?? String(values.jewellerId))).map((product) => ({ label: product.name, value: product.id })) },
    { key: "date", label: "Preferred visit date", type: "date", required: true }, { key: "time", label: "Preferred visit time", type: "time", required: true },
    { key: "status", label: "Query status", type: "select", options: visitStatuses.map((value) => ({ label: value, value })) },
    { key: "message", label: "Customer message", type: "textarea" },
  ];
  function add(values: FormValues) {
    if (!data) return;
    const owner = jewellerId ?? String(values.jewellerId);
    const product = data.products.find((item) => item.id === String(values.productId) && item.jewellerId === owner);
    if (!product) throw new Error("Choose a product belonging to the selected shop.");
    const availabilityError = validateVisitAvailability(data.visitingHours.find((item) => item.jewellerId === owner), String(values.date), String(values.time));
    if (availabilityError) throw new Error(availabilityError);
    const visit: StoreVisit = { id: id(), customerName: String(values.customerName).trim(), mobile: String(values.mobile).trim(), email: String(values.email ?? "").trim(), productId: product.id, jewellerId: owner, date: String(values.date), time: String(values.time), message: String(values.message ?? "").trim(), status: String(values.status || "New") as VisitStatus, createdAt: new Date().toISOString() };
    saveStoreVisit(visit); setAdding(false); reload(); setToast("Store visit query saved.");
  }
  function setVisitStatus(visitId: string, next: VisitStatus) { updateVisitStatus(visitId, next); reload(); setToast("Query status updated."); }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading visit requests…</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Customer care</p><h1 className="mt-1 text-2xl font-semibold">Store Visits & Queries</h1><p className="mt-1 text-sm text-slate-500">Review enquiries and keep appointment statuses current.</p></div><ActionButton onClick={() => setAdding(true)}><Plus size={16} /> Add query</ActionButton></div>
    <Panel title={`${rows.length} queries`} description="Storefront demo enquiries are saved locally and appear here." action={<a href="/visit-request" target="_blank" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-gray-50"><CalendarPlus size={15} /> Open public enquiry form</a>}>
      <div className="mb-4 flex flex-wrap gap-3"><SearchInput value={search} onChange={setSearch} placeholder="Search customer, mobile or email…" /><select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm"><option value="all">All statuses</option>{visitStatuses.map((item) => <option key={item}>{item}</option>)}</select></div>
      {rows.length ? <Table headings={["Query", "Customer", "Product / Shop", "Preferred visit", "Message", "Status", "Created"]}>{rows.map((visit) => { const product = data.products.find((item) => item.id === visit.productId); const shop = data.jewellers.find((item) => item.id === visit.jewellerId); return <tr key={visit.id}><td className="px-3 py-3"><p className="font-medium">{visit.id}</p><p className="text-xs text-slate-500">{visit.mobile}</p><p className="text-xs text-slate-500">{visit.email}</p></td><td className="px-3 py-3">{visit.customerName}</td><td className="px-3 py-3">{product?.name || "Product removed"}<p className="text-xs text-slate-500">{shop?.shop.shopName}</p></td><td className="px-3 py-3">{visit.date}<p className="text-xs text-slate-500">{visit.time}</p></td><td className="max-w-48 px-3 py-3"><span className="line-clamp-2 text-xs text-slate-600">{visit.message || "—"}</span></td><td className="px-3 py-3"><select value={visit.status} onChange={(event) => setVisitStatus(visit.id, event.target.value as VisitStatus)} className="rounded-md border border-gray-200 bg-white px-2 py-1.5 text-xs">{visitStatuses.map((item) => <option key={item}>{item}</option>)}</select></td><td className="px-3 py-3 text-xs text-slate-500">{new Date(visit.createdAt).toLocaleDateString()}</td></tr>; })}</Table> : <EmptyState message="No store visits match your filters." />}
    </Panel>
    {adding && <Modal title="Add store visit query" fields={fields} initial={{ customerName: "", mobile: "", email: "", jewellerId: jewellerId ?? data.jewellers[0]?.id ?? "", productId: productOptions[0]?.value ?? "", date: new Date().toISOString().slice(0, 10), time: "11:00", status: "New", message: "" }} onClose={() => setAdding(false)} onSave={add} />}
    {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button className="ml-4" onClick={() => setToast("")}>×</button></div>}
  </div>;
}
