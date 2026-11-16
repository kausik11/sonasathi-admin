import { Suspense } from "react";
import DashboardShell from "../../../src/components/dashboard/DashboardShell";

export default function AdminDashboardLayout({ children }: LayoutProps<"/admin/dashboard">) {
  return <Suspense fallback={<div className="grid min-h-screen place-items-center bg-[#f6f4ee] text-sm text-slate-500">Loading dashboard…</div>}><DashboardShell role="admin">{children}</DashboardShell></Suspense>;
}
