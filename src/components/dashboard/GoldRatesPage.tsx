"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, RefreshCw, Save } from "lucide-react";
import { getDemoSession } from "../../services/demoSession";
import { getGoldRates, recordGoldFetch, saveGoldFetchTimes, saveGoldRateOverride, saveReferenceGoldRate } from "../../services/dashboardDataService";
import { useDashboardData } from "../../hooks/useDashboardData";
import { ActionButton, Modal, Panel, Table, type FormField, type FormValues } from "./SharedUI";
import { SUPPORTED_GOLD_PURITIES } from "../../utils/productPricing";
import { getAppliedGoldRate } from "../../utils/productPricing";

const rupees = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);

export default function GoldRatesPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [reference, setReference] = useState("");
  const [times, setTimes] = useState<[string, string]>(["10:00", "16:00"]);
  const [addingOverride, setAddingOverride] = useState(false);
  const [nowMs, setNowMs] = useState(0);
  const [overridePurity, setOverridePurity] = useState<string>("24K");
  const [overrideRate, setOverrideRate] = useState("");
  const sessionId = role === "jeweller" ? getDemoSession()?.id : null;
  const jewellers = useMemo(() => (data?.jewellers ?? []).filter((item) => !sessionId || item.id === sessionId), [data, sessionId]);
  const gold = data?.gold;
  const fields: FormField[] = [
    ...(role === "admin" ? [{ key: "jewellerId", label: "Jeweller", type: "select" as const, required: true, options: (data?.jewellers ?? []).map((item) => ({ label: item.shop.shopName, value: item.id })) }] : []),
    { key: "purity", label: "Purity", type: "select", required: true, options: SUPPORTED_GOLD_PURITIES.map((value) => ({ label: value, value })) },
    { key: "rate24k", label: "Custom rate for selected purity (₹ / g)", type: "number", step: "0.01", required: true },
  ];
  useEffect(() => { const timer = window.setTimeout(() => { setNowMs(new Date().getTime()); try { setTimes(getGoldRates().fetchTimes); } catch { /* the page already shows the dashboard storage error */ } }, 0); return () => window.clearTimeout(timer); }, []);

  async function fetchRate() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch("/api/gold-rates/ibja", { cache: "no-store" });
      const result = await response.json() as { success: boolean; rate24k?: number; source?: string; message?: string; sourceTimestamp?: string; currency?: string; unit?: string };
      recordGoldFetch({ rate24k: result.rate24k ?? null, source: result.source ?? "Metals.Dev / IBJA", success: result.success, message: result.message ?? "Rate fetch completed.", sourceTimestamp: result.sourceTimestamp, currency: result.currency, unit: result.unit });
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
    const purity = String(values.purity ?? "24K");
    const rate = Number(values.rate24k);
    if (!Number.isFinite(rate) || rate <= 0) throw new Error("Enter a gold rate greater than zero.");
    saveGoldRateOverride(owner, purity, rate); setAddingOverride(false); reload(); setMessage(`${purity} jeweller override saved. It expires automatically after 24 hours.`);
  }
  function saveJewellerOverride() {
    if (!sessionId) return;
    const rate = Number(overrideRate);
    if (!Number.isFinite(rate) || rate <= 0) { setMessage("Enter a price per gram greater than zero."); return; }
    saveGoldRateOverride(sessionId, overridePurity, rate);
    setOverrideRate(""); reload(); setMessage(`${overridePurity} rate saved. It will be used for your products for 24 hours.`);
  }
  function saveManualRate() {
    const value = Number(reference);
    if (!Number.isFinite(value) || value <= 0) { setMessage("Enter a valid reference rate greater than zero."); return; }
    saveReferenceGoldRate(value); reload(); setMessage("Manual reference rate saved.");
  }
  function saveTimes() { saveGoldFetchTimes(times); reload(); setMessage("Daily fetch times saved. Automatic scheduling requires the local app to be running."); }

  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data || !gold) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading gold rates…</p>;
  const activeOverrides = gold.overrides.filter((item) => item.status !== "expired" && new Date(item.expiresAt).getTime() > nowMs && (!sessionId || item.jewellerId === sessionId));
  const effectivePurityRates = sessionId ? SUPPORTED_GOLD_PURITIES.map((purity) => getAppliedGoldRate(gold, gold.overrides, sessionId, purity, nowMs)) : [];
  return <div className="space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Metal pricing</p><h1 className="mt-1 text-2xl font-semibold">Gold Rates</h1><p className="mt-1 text-sm text-slate-500">IBJA reference rate and shop-specific pricing overrides.</p></div>
    <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
      <Panel title="IBJA reference · 24K" description={`Last successful fetch: ${new Date(gold.lastFetchedAt).toLocaleString()}`} action={role === "admin" ? <ActionButton onClick={() => void fetchRate()} disabled={busy}><RefreshCw size={15} className={busy ? "animate-spin" : ""} />{busy ? "Fetching…" : "Fetch rate"}</ActionButton> : undefined}>
        <div className="flex items-center gap-4"><span className="grid h-12 w-12 place-items-center rounded-xl bg-[#f6eedb] text-[#92723c]"><CircleDollarSign size={25} /></span><div><p className="text-3xl font-semibold text-slate-900">{rupees(gold.referenceRate24k)}</p><p className="text-xs text-slate-500">24K reference · {gold.currency ?? "INR"}/{gold.unit ?? "g"} · {gold.source ?? "Demo sample"}</p><p className="text-xs text-slate-500">Source timestamp: {new Date(gold.sourceTimestamp ?? gold.lastFetchedAt).toLocaleString()}</p></div></div>
        {role === "admin" && <div className="mt-5 flex flex-wrap gap-2"><label className="sr-only" htmlFor="manual-reference-rate">Set manual reference rate</label><input id="manual-reference-rate" type="number" min="1" step="0.01" value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Manual rate per gram" className="min-w-48 flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm" /><ActionButton variant="secondary" onClick={saveManualRate}><Save size={15} /> Save manual rate</ActionButton></div>}
      </Panel>
      <Panel title={sessionId ? "Your purity rates" : "Jeweller rate overrides"} description="Choose a purity and set its price per gram. A custom rate remains active for 24 hours, then the reference estimate is used." action={role === "admin" ? <ActionButton variant="secondary" onClick={() => setAddingOverride(true)}>Add override</ActionButton> : undefined}>
        {sessionId ? <>
          <div className="grid gap-3 rounded-lg bg-[#fbfaf7] p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <label className="block text-xs font-semibold text-slate-600">Metal purity<select value={overridePurity} onChange={(event) => { const purity = event.target.value; setOverridePurity(purity); const existing = gold.overrides.find((item) => item.jewellerId === sessionId && (item.purity ?? "24K") === purity && item.status !== "expired" && new Date(item.expiresAt).getTime() > Date.now()); setOverrideRate(existing ? String(existing.rate24k) : ""); setMessage(""); }} className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm">{SUPPORTED_GOLD_PURITIES.map((purity) => <option key={purity} value={purity}>{purity}</option>)}</select></label>
            <label className="block text-xs font-semibold text-slate-600">Your price per gram (₹)<input type="number" min="0.01" step="0.01" value={overrideRate} onChange={(event) => setOverrideRate(event.target.value)} placeholder="Enter rate" className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm" /></label>
            <ActionButton onClick={saveJewellerOverride}><Save size={15} /> Save rate</ActionButton>
          </div>
          <p className="mt-3 text-xs text-slate-500">Saving a rate replaces that purity’s previous active override. The previous value remains in the audit history.</p>
          <div className="mt-5"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Effective price by purity</p><Table headings={["Purity", "Effective rate / g", "Rate source", "Override expires"]}>{effectivePurityRates.map((item) => { const active = gold.overrides.find((override) => override.jewellerId === sessionId && (override.purity ?? "24K") === item.purity && override.status !== "expired" && new Date(override.expiresAt).getTime() > nowMs); return <tr key={item.purity}><td className="px-3 py-3 font-medium">{item.purity}</td><td className="px-3 py-3">{rupees(item.ratePerGram)} / g</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${item.overridden ? "bg-violet-50 text-violet-700" : "bg-amber-50 text-amber-800"}`}>{item.overridden ? "Your custom rate" : "24K reference estimate"}</span></td><td className="px-3 py-3 text-xs text-slate-500">{active ? new Date(active.expiresAt).toLocaleString() : "—"}</td></tr>; })}</Table></div>
        </> : activeOverrides.length ? <Table headings={["Shop", "Purity", "Rate", "Updated", "Expires"]}>{activeOverrides.map((item) => <tr key={item.id ?? `${item.jewellerId}-${item.purity}`}><td className="px-3 py-3 font-medium">{data.jewellers.find((j) => j.id === item.jewellerId)?.shop.shopName ?? item.jewellerId}</td><td className="px-3 py-3">{item.purity ?? "24K"}</td><td className="px-3 py-3">{rupees(item.rate24k)} / g</td><td className="px-3 py-3 text-xs text-slate-500">{new Date(item.updatedAt).toLocaleString()}</td><td className="px-3 py-3 text-xs text-slate-500">{new Date(item.expiresAt).toLocaleString()}</td></tr>)}</Table> : <p className="text-sm text-slate-500">No active overrides.</p>}
        <div className="mt-5 border-t border-gray-100 pt-4"><p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Override audit history</p>{gold.overrides.filter((item) => !sessionId || item.jewellerId === sessionId).length ? <Table headings={["Shop", "Purity", "Rate", "Started", "Ended", "Status"]}>{gold.overrides.filter((item) => !sessionId || item.jewellerId === sessionId).slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map((item) => { const expired = item.status === "expired" || new Date(item.expiresAt).getTime() <= nowMs; return <tr key={item.id ?? `${item.jewellerId}-${item.purity}-${item.updatedAt}`}><td className="px-3 py-3">{data.jewellers.find((j) => j.id === item.jewellerId)?.shop.shopName ?? item.jewellerId}</td><td className="px-3 py-3">{item.purity ?? "24K"}</td><td className="px-3 py-3">{rupees(item.rate24k)} / g</td><td className="px-3 py-3 text-xs">{new Date(item.updatedAt).toLocaleString()}</td><td className="px-3 py-3 text-xs">{new Date(item.expiresAt).toLocaleString()}{item.endReason ? ` · ${item.endReason}` : ""}</td><td className="px-3 py-3">{expired ? "Expired" : "Active"}</td></tr>; })}</Table> : <p className="text-sm text-slate-500">No override history.</p>}</div>
      </Panel>
    </div>
    {role === "admin" && <Panel title="Fetch schedule" description="The dashboard checks these times while the admin dashboard remains open in this browser."><div className="flex flex-wrap items-end gap-4">{times.map((time, index) => <label key={index} className="text-xs font-semibold text-slate-600">Fetch {index + 1}<input type="time" value={time} onChange={(event) => setTimes((old) => old.map((item, i) => i === index ? event.target.value : item) as [string, string])} className="mt-1.5 block rounded-lg border border-gray-200 px-3 py-2 text-sm" /></label>)}<ActionButton variant="secondary" onClick={saveTimes}><Save size={15} /> Save times</ActionButton></div></Panel>}
    {message && <p role="status" className="rounded-lg border border-[#e8e4da] bg-white px-4 py-3 text-sm text-slate-700">{message}</p>}
    <Panel title="Fetch history & API logs" description="Successful rate updates and failed requests are recorded locally.">{gold.history.length ? <Table headings={["Time", "Source", "Rate", "Result"]}>{gold.history.map((item) => <tr key={item.id}><td className="px-3 py-3 text-xs text-slate-500">{new Date(item.fetchedAt).toLocaleString()}</td><td className="px-3 py-3">{item.source}</td><td className="px-3 py-3">{item.rate24k ? `${rupees(item.rate24k)} / g` : "—"}</td><td className="px-3 py-3"><span className={`rounded-full px-2 py-1 text-xs ${item.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{item.success ? "Success" : "Failed"}: {item.message}</span></td></tr>)}</Table> : <p className="text-sm text-slate-500">No fetch attempts logged.</p>}</Panel>
    {addingOverride && <Modal title="Set jeweller gold-rate override" fields={fields} initial={{ jewellerId: jewellers[0]?.id || "", purity: "24K", rate24k: "" }} onClose={() => setAddingOverride(false)} onSave={saveOverride} />}
  </div>;
}
