"use client";

import { useState } from "react";
import { CalendarDays, CheckCircle2 } from "lucide-react";
import { useDashboardData } from "../../src/hooks/useDashboardData";
import { saveStoreVisit, type StoreVisit } from "../../src/services/dashboardDataService";
import { validateVisitAvailability } from "../../src/utils/visitAvailability";
import { ActionButton, type FormField, Modal, type FormValues } from "../../src/components/dashboard/SharedUI";

const id = () => `visit-${crypto.randomUUID()}`;

export default function VisitRequestPage() {
  const { data, error, reload } = useDashboardData();
  const [submitted, setSubmitted] = useState(false);
  const [adding, setAdding] = useState(false);
  const jewellers = data?.jewellers.filter((item) => item.status === "active") ?? [];
  const activeJewellerId = jewellers[0]?.id || "";
  const products = data?.products.filter((item) => item.jewellerId === activeJewellerId && item.status === "published") ?? [];
  const fields: FormField[] = [
    { key: "customerName", label: "Your name", required: true }, { key: "mobile", label: "Mobile number", type: "tel", required: true },
    { key: "email", label: "Email address", type: "email" },
    { key: "jewellerId", label: "Jeweller / shop", type: "select", required: true, options: jewellers.map((item) => ({ label: item.shop.shopName, value: item.id })) },
    { key: "productId", label: "Interested jewellery", type: "select", required: true, options: (values) => data?.products.filter((item) => item.jewellerId === String(values.jewellerId || activeJewellerId) && item.status === "published").map((item) => ({ label: item.name, value: item.id })) ?? [] },
    { key: "date", label: "Preferred visit date", type: "date", required: true }, { key: "time", label: "Preferred visit time", type: "time", required: true },
    { key: "message", label: "Message", type: "textarea", placeholder: "Tell the shop what you would like to see." },
  ];
  function submit(values: FormValues) {
    const owner = String(values.jewellerId);
    const product = data?.products.find((item) => item.id === String(values.productId) && item.jewellerId === owner && item.status === "published");
    if (!product) throw new Error("Choose an available product from the selected shop.");
    const availabilityError = validateVisitAvailability(data?.visitingHours.find((item) => item.jewellerId === owner), String(values.date), String(values.time));
    if (availabilityError) throw new Error(availabilityError);
    const visit: StoreVisit = { id: id(), customerName: String(values.customerName).trim(), mobile: String(values.mobile).trim(), email: String(values.email ?? "").trim(), productId: product.id, jewellerId: owner, date: String(values.date), time: String(values.time), message: String(values.message ?? "").trim(), status: "New", createdAt: new Date().toISOString() };
    saveStoreVisit(visit); reload(); setAdding(false); setSubmitted(true);
  }
  if (error) return <main className="grid min-h-screen place-items-center bg-[#f6f4ee] p-5"><p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p></main>;
  if (!data) return <main className="grid min-h-screen place-items-center bg-[#f6f4ee] text-sm text-slate-500">Loading shops…</main>;
  return <main className="min-h-screen bg-[#f6f4ee] px-4 py-12"><div className="mx-auto max-w-2xl"><div className="mb-7"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#9a773e]">Sonasathi · Store visit</p><h1 className="mt-2 text-3xl font-semibold text-[#26312b]">Plan your jewellery visit</h1><p className="mt-2 text-sm leading-6 text-slate-600">Send an enquiry to a jewellery shop and choose a preferred time to visit.</p></div>
    {submitted ? <section className="rounded-2xl border border-green-200 bg-white p-8 text-center shadow-sm"><CheckCircle2 size={38} className="mx-auto text-green-600" /><h2 className="mt-3 text-xl font-semibold">Request received</h2><p className="mt-2 text-sm text-slate-600">Your visit request is saved in this browser demo.</p><button onClick={() => setSubmitted(false)} className="mt-5 text-sm font-medium text-[#806334]">Send another request</button></section> : <section className="rounded-2xl border border-[#e8e4da] bg-white p-6 shadow-sm sm:p-8"><div className="mb-5 flex items-center gap-3 text-sm text-slate-600"><CalendarDays size={18} className="text-[#9a773e]" /> Choose a shop and a published product.</div><ActionButton onClick={() => setAdding(true)}>Open enquiry form</ActionButton><p className="mt-5 text-xs leading-5 text-slate-500">Local browser demo: requests are saved only on this app’s origin. The separate React storefront at another origin cannot read this browser storage without a backend or same-origin proxy.</p></section>}
    {adding && <Modal title="Request a store visit" fields={fields} initial={{ customerName: "", mobile: "", email: "", jewellerId: activeJewellerId, productId: products[0]?.id ?? "", date: new Date().toISOString().slice(0, 10), time: "11:00", message: "" }} onClose={() => setAdding(false)} onSave={submit} saveLabel="Send request" />}
  </div></main>;
}
