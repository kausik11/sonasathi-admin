"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, RefreshCw, Save } from "lucide-react";
import { getDemoSession } from "../../services/demoSession";
import { getGoldRates, recordGoldFetch, saveGoldFetchTimes, saveGoldRateOverride, saveReferenceGoldRate } from "../../services/dashboardDataService";
import { useDashboardData } from "../../hooks/useDashboardData";
import { ActionButton, Modal, Panel, Table, type FormField, type FormValues } from "./SharedUI";

const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function GoldRatesPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [times, setTimes] = useState<[string, string]>(["10:00", "16:00"]);
  const [addingOverride, setAddingOverride] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const sessionId = role === "jeweller" ? getDemoSession()?.id : null;
  const jewellers = useMemo(() => (data?.jewellers ?? []).filter((item) => !sessionId || item.id === sessionId), [data, sessionId]);
  const gold = data?.gold;
  const ownOverride = gold?.overrides.find((item) => item.jewellerId === sessionId && new Date(item.expiresAt).getTime() > nowMs);
  const fields: FormField[] = [
    ...(role === "admin" ? [{ key: "jewellerId", label: "Jeweller", type: "select" as const, required: true, options: (data?.jewellers ?? []).map((item) => ({ label: item.shop.shopName, value: item.id })) }] : []),
    { key: "rate24k", label: "Custom 24K rate (₹ / g)", type: "number", step: "0.01", required: true },
  ];
  useEffect(() => { const timer = window.setTimeout(() => { setNowMs(new Date().getTime()); try { setTimes(getGoldRates().fetchTimes); } catch { /* the page already shows the dashboard storage error */ } }, 0); return () => window.clearTimeout(timer); }, []);

  async function fetchRate() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/gold-rate", { method: "POST" });
      const result = await response.json() as { success: boolean; rate24k?: number; source?: string; message?: string; fetchedAt?: string };
      recordGoldFetch({ rate24k: result.rate24k ?? null, source: result.source ?? "Metals.Dev / IBJA", success: result.success, message: result.message ?? "Rate fetch completed." });
      setMessage(result.success ? `Updated IBJA reference rate to ${rupees(result.rate24k ?? 0)} per gram.` : result.message ?? "Gold rate fetch failed; the error was logged.");
      reload();
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : "Rate service could not be reached.";
      try { recordGoldFetch({ rate24k: null, source: "Metals.Dev / IBJA", success: false, message: detail }); } catch { /* keep the fetch message visible */ }
      setMessage(detail); reload();
    } finally { setBusy(false); }
  }
  function saveOverride(values: FormValues) {
    const owner = sessionId ?? String(values.jewellerId);
    const rate = Number(values.rate24k);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Enter a gold rate greater than zero.");
    saveGoldRateOverride(owner, rate); setAddingOverride(false); reload(); setMessage("Jeweller override saved. It expires automatically after 24 hours.");
  }
  function saveManualRate() {
    const value = Number(reference);
    if (!Number.isFinite(value) || value <= 0) { setMessage("Enter a valid reference rate greater than zero."); return; }
    saveReferenceGoldRate(value); reload(); setMessage("Manual reference rate saved.");
  }
  function saveTimes() { saveGoldFetchTimes(times); reload(); setMessage("Daily fetch times saved. Automatic scheduling requires the local app to be running."); }

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data || !gold) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading gold rates…</p>;
  const activeOverrides = gold.overrides.filter((item) => new Date(item.expiresAt).getTime() > nowMs && (!sessionId || item.jewellerId === sessionId));
  return <div className="space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Metal pricing</p><h1 className="mt-1 text-2xl font-semibold">Gold Rates</h1><p className="mt-1 text-sm text-slate-500">IBJA reference rate and shop-specific pricing overrides.</p></div>
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="IBJA reference · 24K" description={`Last successful fetch: ${new Date(gold.lastFetchedAt).toLocaleString()}`} action={role === "admin" ? <ActionButton onClick={() => void fetchRate()} disabled={busy}><RefreshCw size={15} className={busy ? "animate-spin" : ""} />{busy ? "Fetching…" : "Fetch rate"}</ActionButton> : undefined}>
        <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f6eedb] text-[#92723c]"><CircleDollarSign size={25} /></span><div><p className="text-3xl font-semibold text-slate-900">{rupees(gold.referenceRate24k)}</p><p className="text-xs text-slate-500">per gram · demo reference until API is configured</p></div></div>
        {role === "admin" && <div className="mt-5 flex flex-wrap gap-2"><label className="sr-only" htmlFor="manual-reference-rate">Set manual reference rate</label><input id="manual-reference-rate" type="number" min="1" step="0.01" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Manual rate per gram" className="min-w-48 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" /><ActionButton variant="secondary" onClick={saveManualRate}><Save size={15} /> Save manual rate</ActionButton></div>}
      </Panel>
      <Panel title="Jeweller rate overrides" description="Custom rates remain active for 24 hours, then fall back to the reference rate." action={<ActionButton variant="secondary" onClick={() => setAddingOverride(true)}>Add override</ActionButton>}>
        {activeOverrides.length ? <Table headings={["Shop", "24K rate", "Updated", "Expires"]}>{activeOverrides.map((item) => <tr key={item.jewellerId}><td className="px-3 py-3 font-medium">{data.jewellers.find((j) => j.id === item.jewellerId)?.shop.shopName ?? item.jewellerId}</td><td className="px-3 py-3">{rupees(item.rate24k)} / g</td><td className="px-3 py-3 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleString()}</td><td className="px-3 py-3 text-xs text-slate-500">{new Date(item.expiresAt).toLocaleString()}</td></tr>)}</Table> : <p className="text-sm text-slate-500">{sessionId ? `Your effective rate is ${rupees(ownOverride?.rate24k ?? gold.referenceRate24k)} per gram.` : "No active overrides."}</p>}
        {sessionId && <p className="mt-3 rounded-lg bg-[#f8f5ed] p-3 text-sm text-slate-700">Your current effective rate: <strong>{rupees(ownOverride?.rate24k ?? gold.referenceRate24k)} / g</strong></p>}
      </Panel>
    </div>
    {role === "admin" && <Panel title="Fetch schedule" description="The dashboard checks these times while the admin dashboard remains open in this browser."><div className="flex flex-wrap items-end gap-4">{times.map((time, index) => <label key={index} className="text-xs font-semibold text-slate-600">Fetch {index + 1}<input type="time" value={time} onChange={(event) => setTimes((old) => old.map((item, i) => i === index ? event.target.value : item) as [string, string])} className="mt-1.5 block rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>)}<ActionButton variant="secondary" onClick={saveTimes}><Save size={15} /> Save times</ActionButton></div></Panel>}
    {message && <p role="status" className="rounded-lg border border-[#e8e4da] bg-white px-4 py-3 text-sm text-slate-700">{message}</p>}
    <Panel title="Fetch history & API logs" description="Successful rate updates and failed requests are recorded locally.">{gold.history.length ? <Table headings={["Time", "Source", "Rate", "Result"]}>{gold.history.map((item) => <tr key={item.id}><td className="px-3 py-3 text-xs text-slate-500">{new Date(item.fetchedAt).toLocaleString()}</td><td className="px-3 py-3">{item.source}</td><td className="px-3 py-3">{item.rate24k ? `${rupees(item.rate24k)} / g` : "—"}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${item.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{item.success ? "Success" : "Failed"}: {item.message}</span></td></tr>)}</Table> : <p className="text-sm text-slate-500">No fetch attempts logged.</p>}</Panel>
    {addingOverride && <Modal title="Set jeweller gold-rate override" fields={fields} initial={{ jewellerId: jewellers[0]?.id || "", rate24k: "" }} onClose={() => setAddingOverride(false)} onSave={saveOverride} />}
  </div>;
}
