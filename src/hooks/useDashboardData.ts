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
  useEffect(() => { const timer = window.setTimeout(reload, 0); return () => window.clearTimeout(timer); }, [reload]);
  return { data, error, reload };
}
