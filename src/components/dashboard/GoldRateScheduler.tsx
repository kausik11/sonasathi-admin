"use client";

import { useEffect } from "react";
import { getGoldRates, recordGoldFetch, refreshGoldOverrideExpiry } from "../../services/dashboardDataService";

const LAST_SCAN = "sonasathi:gold-scheduler:last-scan:v1";
const DONE = "sonasathi:gold-scheduler:completed-slots:v1";
const istDate = (date: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

export default function GoldRateScheduler({ role = "admin" }: { role?: "admin" | "jeweller" }) {
  useEffect(() => {
    let active = true;
    const process = async () => {
      try {
        if (refreshGoldOverrideExpiry()) window.dispatchEvent(new Event("sonasathi:data-changed"));
        if (role !== "admin" || document.visibilityState !== "visible") return;
        const now = new Date();
        const lastScan = Number(localStorage.getItem(LAST_SCAN) || 0);
        const lower = lastScan || new Date(`${istDate(now)}T00:00:00+05:30`).getTime();
        const dayStart = new Date(`${istDate(new Date(lower))}T00:00:00+05:30`).getTime();
        const days = Math.min(8, Math.max(1, Math.ceil((now.getTime() - dayStart) / 86400000) + 1));
        const due: Array<{ slot: string; instant: number }> = [];
        for (let d = 0; d < days; d++) {
          const base = dayStart + d * 86400000;
          const ymd = istDate(new Date(base));
          for (const time of getGoldRates().fetchTimes) {
            const instant = new Date(`${ymd}T${time}:00+05:30`).getTime();
            const slot = `${ymd}-${time}`;
            if (instant > lower && instant <= now.getTime()) due.push({ slot, instant });
          }
        }
        due.sort((a, b) => a.instant - b.instant);
        const completed = new Set<string>(JSON.parse(localStorage.getItem(DONE) || "[]") as string[]);
        for (const item of due) {
          if (!active || completed.has(item.slot)) continue;
          completed.add(item.slot);
          localStorage.setItem(DONE, JSON.stringify([...completed].slice(-40)));
          try {
            const response = await fetch("/api/gold-rates/ibja", { cache: "no-store" });
            const result = await response.json() as { success: boolean; rate24k?: number; source?: string; message?: string; sourceTimestamp?: string; currency?: string; unit?: string };
            if (active) recordGoldFetch({ rate24k: result.rate24k ?? null, source: result.source ?? "Metals.Dev / IBJA scheduled", success: result.success, message: `${item.slot}: ${result.message ?? "Scheduled fetch completed."}`, sourceTimestamp: result.sourceTimestamp, currency: result.currency, unit: result.unit });
          } catch (error) { if (active) recordGoldFetch({ rate24k: null, source: "Metals.Dev / IBJA scheduled", success: false, message: `${item.slot}: ${error instanceof Error ? error.message : "Scheduled request failed."}` }); }
        }
        localStorage.setItem(LAST_SCAN, String(now.getTime()));
      } catch { /* the dashboard surfaces storage failures in its data sections */ }
    };
    void process();
    const interval = window.setInterval(() => void process(), 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, [role]);
  return null;
}
