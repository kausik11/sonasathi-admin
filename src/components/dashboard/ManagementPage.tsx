"use client";

import AccountsPage from "./AccountsPage";
import CategoriesPage from "./CategoriesPage";
import GoldRatesPage from "./GoldRatesPage";
import ProductImagesPage from "./ProductImagesPage";
import ProductsPage from "./ProductsPage";
import SettingsPage from "./SettingsPage";
import ShopProfilesPage from "./ShopProfilesPage";
import StoreVisitsPage from "./StoreVisitsPage";
import VisitingHoursPage from "./VisitingHoursPage";

export default function ManagementPage({ section, role }: { section: string; role: "admin" | "jeweller" }) {
  if (section === "accounts" && role === "admin") return <AccountsPage />;
  if (section === "shop-profiles" && role === "admin") return <ShopProfilesPage role="admin" />;
  if (section === "profile" && role === "jeweller") return <ShopProfilesPage role="jeweller" />;
  if (section === "products") return <ProductsPage role={role} />;
  if (section === "images") return <ProductImagesPage role={role} />;
  if (section === "store-visits") return <StoreVisitsPage role={role} />;
  if (section === "categories" && role === "admin") return <CategoriesPage />;
  if (section === "gold-rates") return <GoldRatesPage role={role} />;
  if (section === "visiting-hours") return <VisitingHoursPage role={role} />;
  if (section === "settings") return <SettingsPage role={role} />;
  return <div className="rounded-xl border border-[#e8e4da] bg-white p-8"><h1 className="text-xl font-semibold">Page not found</h1><p className="mt-2 text-sm text-slate-500">This section is not available for your demo account.</p></div>;
}
