"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { MapPin, Pencil, Phone, Store } from "lucide-react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getDemoSession } from "../../services/demoSession";
import { saveJeweller, type Jeweller } from "../../services/dashboardDataService";
import { ActionButton, Modal, Panel, type FormField, type FormValues } from "./SharedUI";

const fields: FormField[] = [
  { key: "shopName", label: "Shop name", required: true }, { key: "ownerName", label: "Owner name", required: true },
  { key: "address", label: "Shop address", required: true }, { key: "city", label: "City" }, { key: "pin", label: "PIN code" },
  { key: "phone", label: "Contact number", type: "tel" }, { key: "whatsapp", label: "WhatsApp", type: "tel" }, { key: "email", label: "Email", type: "email" },
  { key: "description", label: "Shop description", type: "textarea" }, { key: "logoData", label: "Shop logo", type: "file" }, { key: "bannerData", label: "Shop banner", type: "file" },
];

export default function ShopProfilesPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const [editing, setEditing] = useState<Jeweller | null>(null);
  const [toast, setToast] = useState("");
  const jewellerId = role === "jeweller" ? getDemoSession()?.id : null;
  const records = useMemo(() => (data?.jewellers ?? []).filter((item) => !jewellerId || item.id === jewellerId), [data, jewellerId]);
  function save(values: FormValues) {
    if (!editing) return;
    const shop = { ...editing.shop, shopName: String(values.shopName).trim(), ownerName: String(values.ownerName).trim(), address: String(values.address).trim(), city: String(values.city), pin: String(values.pin), phone: String(values.phone), whatsapp: String(values.whatsapp), email: String(values.email), description: String(values.description), logoData: String(values.logoData ?? ""), bannerData: String(values.bannerData ?? "") };
    saveJeweller({ ...editing, name: shop.ownerName, email: shop.email, phone: shop.phone, shop });
    setEditing(null); reload(); setToast("Shop profile saved.");
  }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading shop profiles…</p>;
  return <div className="space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Store information</p><h1 className="mt-1 text-2xl font-semibold">Shop Profiles</h1><p className="mt-1 text-sm text-slate-500">Keep each shop’s public details and branding up to date.</p></div>
    <div className="grid gap-4 xl:grid-cols-2">{records.map((record) => <Panel key={record.id} title={record.shop.shopName} description={`${record.shop.ownerName} · ${record.shop.city}`} action={<ActionButton variant="secondary" onClick={() => setEditing(record)}><Pencil size={15} /> Edit profile</ActionButton>}>
      <div className="flex gap-4">{record.shop.logoData ? <Image src={record.shop.logoData} alt={`${record.shop.shopName} logo`} width={64} height={64} unoptimized className="h-16 w-16 rounded-lg border border-gray-200 object-cover" /> : <div className="grid h-16 w-16 place-items-center rounded-lg bg-[#f5f0e3] text-[#8f7440]"><Store size={23} /></div>}
        <div className="min-w-0 flex-1 space-y-2 text-sm text-slate-700"><p className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />{record.shop.address}, {record.shop.city} {record.shop.pin}</p><p className="flex items-center gap-2"><Phone size={15} className="text-slate-400" />{record.shop.phone} <span className="text-slate-400">·</span> WhatsApp {record.shop.whatsapp}</p><p className="truncate text-slate-500">{record.shop.email}</p></div>
      </div><p className="mt-4 text-sm leading-6 text-slate-500">{record.shop.description || "No shop description added."}</p>{record.shop.bannerData && <Image src={record.shop.bannerData} alt={`${record.shop.shopName} banner`} width={1200} height={448} unoptimized className="mt-4 h-28 w-full rounded-lg object-cover" />}
    </Panel>)}</div>
    {editing && <Modal title={`Edit ${editing.shop.shopName}`} fields={fields} initial={{ ...editing.shop }} onClose={() => setEditing(null)} onSave={save} />}
    {toast && <div className="fixed bottom-5 right-5 z-[80] rounded-lg bg-[#20382e] px-4 py-3 text-sm text-white shadow-xl">{toast}<button className="ml-4 opacity-70" onClick={() => setToast("")}>×</button></div>}
  </div>;
}
