"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Store, UserRoundCheck, UserRoundX } from "lucide-react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { saveJeweller, type Jeweller } from "../../services/dashboardDataService";
import { ActionButton, EmptyState, Modal, Panel, SearchInput, Table, type FormField, type FormValues } from "./SharedUI";

const id = () => `jeweller-${crypto.randomUUID()}`;
const fields: FormField[] = [
  { key: "name", label: "Account name", required: true }, { key: "email", label: "Email address", type: "email", required: true },
  { key: "phone", label: "Contact number", type: "tel", required: true }, { key: "password", label: "Demo password", type: "password", required: true },
  { key: "status", label: "Account status", type: "select", options: [{ label: "Active", value: "active" }, { label: "Inactive", value: "inactive" }] },
  { key: "shopName", label: "Shop name", required: true }, { key: "city", label: "City" }, { key: "address", label: "Address" },
];

export default function AccountsPage() {
  const { data, error, reload } = useDashboardData();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Jeweller | null | false>(false);
  const [toast, setToast] = useState("");
  const records = useMemo(() => (data?.jewellers ?? []).filter((item) => `${item.name} ${item.email} ${item.shop.shopName}`.toLowerCase().includes(search.toLowerCase())), [data, search]);

  async function save(values: FormValues) {
    if (!data) return;
    const current = editing || null;
    const email = String(values.email).trim().toLowerCase();
    if (data.jewellers.some((item) => item.email.toLowerCase() === email && item.id !== current?.id)) throw new Error("That email is already assigned to a jeweller.");
    const shop = { ...(current?.shop ?? { whatsapp: "", description: "", pin: "", logoData: "", bannerData: "" }), shopName: String(values.shopName), ownerName: String(values.name), email, phone: String(values.phone), address: String(values.address ?? ""), city: String(values.city ?? ""), pin: current?.shop.pin ?? "", whatsapp: current?.shop.whatsapp ?? String(values.phone), description: current?.shop.description ?? "" };
    saveJeweller({ id: current?.id ?? id(), name: String(values.name).trim(), email, phone: String(values.phone).trim(), password: String(values.password), status: String(values.status) as Jeweller["status"], shop, createdAt: current?.createdAt ?? new Date().toISOString() });
    setEditing(false); reload(); setToast(current ? "Jeweller account updated." : "Jeweller account created.");
  }

  function toggleStatus(record: Jeweller) {
    saveJeweller({ ...record, status: record.status === "active" ? "inactive" : "active" });
    reload(); setToast(`Account ${record.status === "active" ? "deactivated" : "activated"}.`);
  }

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading jeweller accounts…</p>;
  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">People</p><h1 className="mt-1 text-2xl font-semibold">Jeweller Accounts</h1><p className="mt-1 text-sm text-slate-500">Manage demo access and shop account status.</p></div><ActionButton onClick={() => setEditing(null)}><Plus size={16} /> Add jeweller</ActionButton></div>
    <Panel title={`${records.length} jeweller${records.length === 1 ? "" : "s"}`} description="Accounts are stored in this browser for the local demo." action={<SearchInput value={search} onChange={setSearch} placeholder="Search jewellers…" />}>
      {records.length ? <Table headings={["Jeweller", "Shop", "Contact", "Status", "Products", "Actions"]}>{records.map((record) => <tr key={record.id}><td className="px-3 py-3"><p className="font-medium text-slate-800">{record.name}</p><p className="text-xs text-slate-500">{record.email}</p></td><td className="px-3 py-3">{record.shop.shopName}<p className="text-xs text-slate-500">{record.shop.city}</p></td><td className="px-3 py-3">{record.phone}</td><td className="px-3 py-3"><span className={`rounded-full px-2.5 py-1 text-xs ${record.status === "active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{record.status}</span></td><td className="px-3 py-3">{data.products.filter((item) => item.jewellerId === record.id).length}</td><td className="px-3 py-3"><div className="flex flex-wrap gap-1"><button onClick={() => setEditing(record)} className="rounded-md px-2 py-1 text-xs font-medium text-[#785d30] hover:bg-amber-50">Edit</button><button onClick={() => toggleStatus(record)} className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-gray-100">{record.status === "active" ? <UserRoundX size={13} /> : <UserRoundCheck size={13} />}{record.status === "active" ? "Deactivate" : "Activate"}</button><Link href="/admin/dashboard/shop-profiles" className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-slate-600 hover:bg-gray-100"><Store size={13} />Profile</Link></div></td></tr>)}</Table> : <EmptyState message="No jeweller accounts match your search." />}
    </Panel>
    {editing !== false && <Modal title={editing ? "Edit jeweller account" : "Create jeweller account"} fields={fields} initial={editing ? { name: editing.name, email: editing.email, phone: editing.phone, password: editing.password ?? "", status: editing.status, shopName: editing.shop.shopName, city: editing.shop.city, address: editing.shop.address } : { name: "", email: "", phone: "", password: "Jeweller@12345", status: "active", shopName: "", city: "", address: "" }} onClose={() => setEditing(false)} onSave={save} />}
    {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button className="ml-4 opacity-70" onClick={() => setToast("")}>×</button></div>}
  </div>;
}
