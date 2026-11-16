"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, CalendarDays, Gem, Images, UsersRound } from "lucide-react";
import { getDemoSession, type DemoRole } from "../../services/demoSession";
import { getDashboardData, type DemoData } from "../../services/dashboardDataService";
import { listJewelleryImages } from "../../services/imageStorageService";

export default function DashboardOverview({ role }: { role: DemoRole }) {
  const [data, setData] = useState<DemoData | null>(null);
  const [jewellerId, setJewellerId] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState(0);
  const [updatedAt, setUpdatedAt] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUpdatedAt(new Date().toLocaleString());
      try {
        const session = getDemoSession();
        setJewellerId(session?.role === "jeweller" ? session.id : null);
        const next = getDashboardData();
        setData(next);
        const productIds = next.products.filter((product) => session?.role !== "jeweller" || product.jewellerId === session.id);
        setImageCount(productIds.reduce((total, product) => total + listJewelleryImages(product.id, product.jewellerId).length, 0));
      } catch (reason) { setError(reason instanceof Error ? reason.message : "Dashboard data could not be loaded."); }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">{error}</div>;
  if (!data) return <div className="rounded-xl border border-[#e8e4da] bg-white p-6 text-sm text-slate-500">Loading overview…</div>;

  const products = data.products.filter((product) => !jewellerId || product.jewellerId === jewellerId);
  const jewellers = data.jewellers.filter((item) => !jewellerId || item.id === jewellerId);
  const visits = data.visits.filter((visit) => !jewellerId || visit.jewellerId === jewellerId);
  const published = products.filter((product) => product.status === "published").length;
  const links = role === "admin" ? ["accounts", "products", "images", "store-visits"] : ["profile", "products", "images", "store-visits"];
  const paths: Record<string, string> = role === "admin" ? { accounts: "accounts", products: "products", images: "images", "store-visits": "store-visits" } : { profile: "profile", products: "products", images: "images", "store-visits": "store-visits" };
  const headings: Record<string, string> = { accounts: "Jewellers", profile: "Shop profile", products: "Products", images: "Product images", "store-visits": "Visit queries" };
  const stats = role === "admin" ? [
    { label: "Jewellers", value: jewellers.length, icon: UsersRound, tone: "gold" },
    { label: "Listings", value: products.length, icon: Gem, tone: "green" },
    { label: "Product images", value: imageCount, icon: Images, tone: "violet" },
    { label: "Visit queries", value: visits.length, icon: CalendarDays, tone: "blue" },
  ] : [
    { label: "My listings", value: products.length, icon: Gem, tone: "gold" },
    { label: "Published", value: published, icon: Activity, tone: "green" },
    { label: "Product images", value: imageCount, icon: Images, tone: "violet" },
    { label: "Visit queries", value: visits.length, icon: CalendarDays, tone: "blue" },
  ];
  const activity = data.activity.filter((item) => !jewellerId || item.jewellerId === jewellerId).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-[#9a773e]">Workspace summary</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-[#25332c]">{role === "admin" ? "Dashboard Overview" : "Your shop overview"}</h1><p className="mt-1 text-sm text-slate-500">A clear view of your jewellery operations.</p></div><p className="text-xs text-slate-500">{updatedAt ? `Updated ${updatedAt}` : ""}</p></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-xl border border-[#e8e4da] bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm text-slate-500">{label}</p><span className={`grid h-9 w-9 place-items-center rounded-lg ${tone === "gold" ? "bg-[#f6eedb] text-[#92723c]" : tone === "green" ? "bg-[#e7f2eb] text-[#3b7654]" : tone === "violet" ? "bg-[#f0eafb] text-[#7251a2]" : "bg-[#e7f0fb] text-[#4777b5]"}`}><Icon size={18} /></span></div><p className="mt-4 text-3xl font-semibold text-[#26312b]">{value}</p><p className="mt-1 text-xs text-slate-500">{label === "Visit queries" ? "Across your shops" : label === "Listings" || label === "My listings" ? `${published} published` : "Stored in this browser"}</p></div>)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-xl border border-[#e8e4da] bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-[#26312b]">Recent activity</h2><p className="mt-1 text-xs text-slate-500">Latest updates in your workspace</p></div><Activity size={18} className="text-[#a38957]" /></div>{activity.length ? <div className="divide-y divide-gray-100">{activity.map((item) => <div key={item.id} className="flex items-center justify-between gap-3 py-3"><div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#f6f2e9] text-[#947642]"><Gem size={16} /></span><div><p className="text-sm font-medium text-slate-800">{item.label}</p><p className="text-xs text-slate-500">{data.jewellers.find((j) => j.id === item.jewellerId)?.shop.shopName ?? "Sonasathi"}</p></div></div><time className="text-xs text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</time></div>)}</div> : <p className="py-8 text-center text-sm text-slate-500">No recent activity yet.</p>}</section>
        <section className="rounded-xl border border-[#e8e4da] bg-white p-5 shadow-sm"><h2 className="font-semibold text-[#26312b]">Quick links</h2><p className="mt-1 text-xs text-slate-500">Go straight to a workspace</p><div className="mt-4 space-y-2">{links.map((slug) => <Link key={slug} href={`${role === "admin" ? "/admin/dashboard" : "/jeweller/dashboard"}${paths[slug] ? `/${paths[slug]}` : ""}`} className="flex items-center justify-between rounded-lg border border-gray-100 px-3.5 py-3 text-sm text-slate-700 hover:border-[#d6c49d] hover:bg-[#fbf9f4]"><span>{headings[slug]}</span><ArrowUpRight size={16} className="text-slate-400" /></Link>)}</div></section>
      </div>
    </div>
  );
}
