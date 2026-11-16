"use client";

import { useEffect } from "react";
import { getGoldRates, recordGoldFetch } from "../../services/dashboardDataService";

const LAST_RUN = "sonasathi:last-scheduled-gold-fetch";

export default function GoldRateScheduler() {
  useEffect(() => {
    let active = true;
    const check = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const times = getGoldRates().fetchTimes;
        const now = new Date();
        const slot = `${now.toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })}-${now.toLocaleTimeString("en-GB", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" })}`;
        if (!times.includes(slot.slice(-5)) || window.sessionStorage.getItem(LAST_RUN) === slot) return;
        window.sessionStorage.setItem(LAST_RUN, slot);
        try {
          const response = await fetch("/api/gold-rate", { method: "POST" });
          const result = await response.json() as { success: boolean; rate24k?: number; source?: string; message?: string };
          if (active) recordGoldFetch({ rate24k: result.rate24k ?? null, source: result.source ?? "Metals.Dev / IBJA scheduled", success: result.success, message: result.message ?? "Scheduled fetch completed." });
        } catch (reason) {
          if (active) recordGoldFetch({ rate24k: null, source: "Metals.Dev / IBJA scheduled", success: false, message: reason instanceof Error ? reason.message : "Scheduled request failed." });
        }
      } catch { /* storage errors remain visible in the dashboard sections */ }
    };
    void check();
    const interval = window.setInterval(() => void check(), 30000);
    return () => { active = false; window.clearInterval(interval); };
  }, []);
  return null;
}
