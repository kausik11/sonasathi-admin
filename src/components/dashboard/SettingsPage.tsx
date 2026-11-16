"use client";

import { useEffect, useState } from "react";
import { Download, HardDrive, Upload } from "lucide-react";
import { useDashboardData } from "../../hooks/useDashboardData";
import { getDemoSession } from "../../services/demoSession";
import { createExport, getStorageUsage, importData, restoreSeedData, saveSettings } from "../../services/dashboardDataService";
import { deleteAllJewelleryImages, deleteJewellerJewelleryImages } from "../../services/imageStorageService";
import { ActionButton, Panel } from "./SharedUI";

function formatBytes(bytes: number) { return bytes < 1024 ? `${bytes} bytes` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1024 / 1024).toFixed(2)} MB`; }

export default function SettingsPage({ role }: { role: "admin" | "jeweller" }) {
  const { data, error, reload } = useDashboardData();
  const [usage, setUsage] = useState<number | null>(null);
  const [quota, setQuota] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let mounted = true;
    const timer = window.setTimeout(async () => {
      try {
        const local = getStorageUsage();
        const estimate = await navigator.storage?.estimate();
        if (mounted) { setUsage(local); setQuota(estimate?.quota ?? null); }
      } catch { if (mounted) setMessage("Browser storage usage could not be estimated."); }
    }, 0);
    return () => { mounted = false; window.clearTimeout(timer); };
  }, [data]);

  async function exportData() {
    setBusy(true);
    try {
      const blob = new Blob([await createExport()], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `sonasathi-demo-backup-${new Date().toISOString().slice(0, 10)}.json`; anchor.click(); URL.revokeObjectURL(url);
      setMessage("Complete backup downloaded, including saved product images.");
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : "Backup could not be created."); }
    finally { setBusy(false); }
  }
  async function loadImport(file?: File) {
    if (!file) return;
    setBusy(true); setMessage("");
    try { await importData(await file.text()); reload(); setMessage("Backup imported successfully, including saved product images."); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Backup could not be imported."); }
    finally { setBusy(false); }
  }
  function updateSetting(key: "compactTables" | "notifications", value: boolean) {
    if (!data) return;
    saveSettings({ ...data.settings, [key]: value }); reload(); setMessage("Preference saved.");
  }
  function restore() {
    if (!window.confirm("Restore demo seed data? This replaces jeweller, product, enquiry, category, gold-rate and schedule records in this browser.")) return;
    try { restoreSeedData(); reload(); setMessage("Demo seed data restored. Product images remain saved separately."); }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Seed data could not be restored."); }
  }
  async function clearImages() {
    if (!window.confirm(role === "admin" ? "Delete every saved jewellery image and its metadata from this browser? This cannot be undone." : "Delete all jewellery images belonging to your shop? This cannot be undone.")) return;
    setBusy(true);
    try {
      if (role === "admin") await deleteAllJewelleryImages();
      else { const jewellerId = getDemoSession()?.id; if (jewellerId) await deleteJewellerJewelleryImages(jewellerId); }
      reload(); setMessage("Saved product images were cleared.");
    }
    catch (reason) { setMessage(reason instanceof Error ? reason.message : "Images could not be cleared."); }
    finally { setBusy(false); }
  }
  if (error) return <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-800">{error}</p>;
  if (!data) return <p className="rounded-lg bg-white p-5 text-sm text-slate-500">Loading settings…</p>;
  return <div className="space-y-5">
    <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#9a773e]">Workspace</p><h1 className="mt-1 text-2xl font-semibold">Settings</h1><p className="mt-1 text-sm text-slate-500">Preferences, backups and browser storage tools.</p></div>
    <div className="grid gap-5 xl:grid-cols-2">
      <Panel title="Admin preferences" description="These settings are saved locally in this browser.">
        <div className="space-y-4">{[{ key: "compactTables" as const, label: "Compact tables", note: "Use denser row spacing in management tables." }, { key: "notifications" as const, label: "Dashboard notifications", note: "Show notification indicators in the header." }].map((item) => <label key={item.key} className="flex items-center justify-between gap-4"><span><span className="block text-sm font-medium text-slate-800">{item.label}</span><span className="mt-1 block text-xs text-slate-500">{item.note}</span></span><input type="checkbox" checked={data.settings[item.key]} onChange={(event) => updateSetting(item.key, event.target.checked)} className="h-4 w-4 accent-[#34473d]" /></label>)}</div>
      </Panel>
      <Panel title="Browser storage" description="Business records and image records stay in this browser profile.">
        <div className="flex items-center gap-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-[#f6eedb] text-[#92723c]"><HardDrive size={21} /></span><div><p className="font-semibold">{usage === null ? "Measuring…" : formatBytes(usage)} localStorage used</p><p className="mt-1 text-xs text-slate-500">Includes this app’s browser records; image binary may use IndexedDB.</p></div></div>
        {quota && <p className="mt-4 text-xs text-slate-500">Approximate browser storage quota: {formatBytes(quota)}. Actual limits vary by browser and available disk space.</p>}
        {usage !== null && usage > 4 * 1024 * 1024 && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">Storage is getting large. Export a backup and remove unused data if saving fails.</p>}
        <div className="mt-5 flex flex-wrap gap-2"><ActionButton variant="secondary" onClick={() => void clearImages()} disabled={busy}>Clear image cache</ActionButton></div>
      </Panel>
      {role === "admin" && <Panel title="Backup and restore" description="Export or import versioned Sonasathi local demo data.">
        <div className="flex flex-wrap gap-2"><ActionButton onClick={exportData}><Download size={15} /> Export JSON backup</ActionButton><label className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 hover:bg-gray-50 ${busy ? "pointer-events-none opacity-50" : ""}`}><Upload size={15} /> Import JSON<input type="file" accept="application/json,.json" className="sr-only" disabled={busy} onChange={(event) => { void loadImport(event.target.files?.[0]); event.currentTarget.value = ""; }} /></label><ActionButton variant="danger" onClick={restore}>Restore demo seed data</ActionButton></div>
      </Panel>}
      <Panel title="Demo data" description="All changes affect this browser profile only."><p className="text-sm leading-6 text-slate-600">Sonasathi does not sync this demo data with the hosted storefront or another device. Keep a JSON backup before resetting the sample data.</p><div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Quota errors do not automatically remove older images or records. If the browser is full, export a backup and clear images deliberately.</div></Panel>
    </div>
    {message && <p role="status" className="rounded-lg border border-[#e8e4da] bg-white p-3 text-sm text-slate-700">{message}</p>}
  </div>;
}
