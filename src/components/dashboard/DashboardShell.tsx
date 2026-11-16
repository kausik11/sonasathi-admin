"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  Activity, Bell, Boxes, CalendarDays, ChevronLeft, ChevronRight,
  CircleDollarSign, Gem, LayoutDashboard, LogOut, Menu, Settings, Store, Tags,
  UsersRound, X,
} from "lucide-react";
import { getDemoSession, signOutOfDemo, type DemoRole, type DemoSession } from "../../services/demoSession";
import { getJewellers } from "../../services/dashboardDataService";
import GoldRateScheduler from "./GoldRateScheduler";

const adminNav = [
  { label: "Overview", slug: "", icon: LayoutDashboard },
  { label: "Jeweller Accounts", slug: "accounts", icon: UsersRound },
  { label: "Shop Profiles", slug: "shop-profiles", icon: Store },
  { label: "Jewellery Products", slug: "products", icon: Gem },
  { label: "Product Images", slug: "images", icon: Boxes },
  { label: "Store Visits", slug: "store-visits", icon: CalendarDays },
  { label: "Categories", slug: "categories", icon: Tags },
  { label: "Gold Rates", slug: "gold-rates", icon: CircleDollarSign },
  { label: "Visiting Hours", slug: "visiting-hours", icon: Activity },
  { label: "Settings", slug: "settings", icon: Settings },
];
const jewellerNav = [
  { label: "Overview", slug: "", icon: LayoutDashboard },
  { label: "Shop Profile", slug: "profile", icon: Store },
  { label: "Jewellery Products", slug: "products", icon: Gem },
  { label: "Product Images", slug: "images", icon: Boxes },
  { label: "Store Visits", slug: "store-visits", icon: CalendarDays },
  { label: "Gold Rates", slug: "gold-rates", icon: CircleDollarSign },
  { label: "Visiting Hours", slug: "visiting-hours", icon: Activity },
  { label: "Settings", slug: "settings", icon: Settings },
];

const labelForSlug: Record<string, string> = {
  accounts: "Jeweller Accounts", "shop-profiles": "Shop Profiles", products: "Jewellery Products", images: "Product Images",
  "store-visits": "Store Visits & Queries", categories: "Categories", "gold-rates": "Gold Rates", "visiting-hours": "Visiting Hours", profile: "Shop Profile", settings: "Settings",
};

export default function DashboardShell({ role, children }: { role: DemoRole; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [noticeCount] = useState(3);
  const nav = role === "admin" ? adminNav : jewellerNav;
  const prefix = role === "admin" ? "/admin/dashboard" : "/jeweller/dashboard";
  const currentSlug = pathname.startsWith(prefix) ? pathname.slice(prefix.length).replace(/^\//, "").split("/")[0] : "";
  const pageTitle = currentSlug ? labelForSlug[currentSlug] ?? "Overview" : "Dashboard Overview";

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const active = getDemoSession();
      const jewellerIsActive = active?.role !== "jeweller" || getJewellers().some((item) => item.id === active.id && item.status === "active");
      if (!active || active.role !== role || !jewellerIsActive) {
        signOutOfDemo();
        router.replace("/");
        return;
      }
      setSession(active);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [role, router]);

  const title = useMemo(() => pageTitle, [pageTitle]);
  const logout = () => { signOutOfDemo(); router.replace("/"); };
  const sidebarWidth = collapsed ? "lg:w-[84px]" : "lg:w-[264px]";

  if (!session) return <div className="grid min-h-screen place-items-center bg-[#f6f4ee] text-sm text-slate-500">Opening Sonasathi dashboard…</div>;

  return (
    <div className="min-h-screen bg-[#f6f4ee] text-[#26312b]">
      {role === "admin" && <GoldRateScheduler />}
      {mobileOpen && <button aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/40 lg:hidden" />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-[#294239] bg-[#142a22] text-white transition-all duration-200 ${sidebarWidth} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"} ${collapsed ? "w-[264px] lg:w-[84px]" : "w-[264px]"}`}>
        <div className={`flex h-[76px] items-center border-b border-white/10 ${collapsed ? "justify-center px-3" : "justify-between px-5"}`}>
          <Link href={prefix} onClick={() => setMobileOpen(false)} className="min-w-0">
            {collapsed ? <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6b46b] font-bold text-[#17271f]">S</span> : <><span className="block text-sm font-bold tracking-[0.14em] text-[#e1c477]">SONASATHI</span><span className="mt-1 block text-[10px] uppercase tracking-[0.18em] text-white/55">{role === "admin" ? "Admin panel" : "Jeweller panel"}</span></>}
          </Link>
          <button onClick={() => setMobileOpen(false)} aria-label="Close menu" className="rounded p-2 text-white/70 hover:bg-white/10 lg:hidden"><X size={18} /></button>
          <button onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="hidden rounded p-1.5 text-white/60 hover:bg-white/10 lg:block">{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          {nav.map(({ label, slug, icon: Icon }) => {
            const href = slug ? `${prefix}/${slug}` : prefix;
            const active = slug ? currentSlug === slug : !currentSlug;
            return <Link key={slug} href={href} title={collapsed ? label : undefined} onClick={() => setMobileOpen(false)} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition ${active ? "bg-[#34473d] font-semibold text-white shadow-inner" : "text-white/72 hover:bg-white/8 hover:text-white"}`}>
              <Icon size={17} strokeWidth={1.8} className="shrink-0" />{!collapsed && <span>{label}</span>}
            </Link>;
          })}
        </nav>
        <div className="border-t border-white/10 p-3">
          <button onClick={logout} title={collapsed ? "Log out" : undefined} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] text-white/75 hover:bg-white/10 hover:text-white"><LogOut size={17} />{!collapsed && "Log out"}</button>
        </div>
      </aside>

      <div className={`min-h-screen transition-[padding] duration-200 ${collapsed ? "lg:pl-[84px]" : "lg:pl-[264px]"}`}>
        <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[#e8e4da] bg-white/95 px-4 backdrop-blur sm:px-7">
          <div className="flex items-center gap-3">
            <button aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-lg border border-gray-200 p-2 lg:hidden"><Menu size={18} /></button>
            <div><p className="text-sm font-semibold text-[#26312b]">{title}</p><p className="mt-0.5 text-xs text-slate-500">{role === "admin" ? "Welcome, Super Admin" : `Welcome, ${session.name}`}</p></div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <button aria-label={`${noticeCount} notifications`} className="relative rounded-full p-2 text-slate-500 hover:bg-gray-100"><Bell size={18} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#c49d4b]" /></button>
            <div className="hidden h-8 w-px bg-gray-200 sm:block" />
            <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#e9dfc9] text-sm font-semibold text-[#66512e]">{(session.name[0] ?? "S").toUpperCase()}</span><span className="hidden text-xs sm:block"><span className="block font-semibold text-slate-800">{session.name}</span><span className="text-slate-500">{role === "admin" ? "Administrator" : "Jeweller"}</span></span></div>
            <button onClick={logout} className="hidden items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 md:flex"><LogOut size={15} />Logout</button>
          </div>
        </header>
        <div className="px-4 py-5 sm:px-7"><div className="mb-5 flex items-center gap-2 text-xs text-slate-500"><span>Sonasathi</span><span>/</span><span className="text-slate-800">{title}</span></div>{children}</div>
      </div>
    </div>
  );
}
