"use client";

import { useCallback, useEffect, useState } from "react";
import { getDashboardData, type DemoData } from "../services/dashboardDataService";

export function useDashboardData() {
  const [data, setData] = useState<DemoData | null>(null);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    try { setData(getDashboardData()); setError(""); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Saved data could not be loaded."); }
  }, []);
  useEffect(() => {
    const timer = window.setTimeout(reload, 0);
    const onChange = () => reload();
    window.addEventListener("storage", onChange);
    window.addEventListener("sonasathi:data-changed", onChange);
    return () => { window.clearTimeout(timer); window.removeEventListener("storage", onChange); window.removeEventListener("sonasathi:data-changed", onChange); };
  }, [reload]);
  return { data, error, reload };
}
