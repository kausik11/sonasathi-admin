"use client";

import { calculatePriceBreakdown, formatInr, type AppliedGoldRate } from "../../utils/productPricing";
import type { Product } from "../../services/dashboardDataService";

export default function PriceBreakdownTable({ product, rate, compact = false }: { product: Product; rate: AppliedGoldRate; compact?: boolean }) {
  const price = calculatePriceBreakdown(product, rate);
  const rows = [
    { title: `${price.purity} Gold`, rate: formatInr(price.ratePerGram, true), weight: `${price.netGoldWeight.toFixed(2)} g`, discount: "—", value: formatInr(price.goldValue), strong: false },
    { title: `Making Charges (${price.makingChargePercentage}%)`, rate: "—", weight: "—", discount: `${price.makingChargeDiscountPercentage}% off · −${formatInr(price.makingChargeDiscount)}`, value: formatInr(price.netMakingCharge), strong: false },
    { title: `Stone Charges${product.stoneName ? ` · ${product.stoneName}` : ""}`, rate: "—", weight: "—", discount: "—", value: formatInr(price.stoneCharges), strong: false },
    { title: "Breakdown Discount", rate: "—", weight: "—", discount: "Applied once", value: `−${formatInr(price.breakdownDiscount)}`, strong: false },
    { title: "Sub Total", rate: "—", weight: price.grossWeight === null ? "—" : `${price.grossWeight.toFixed(2)} g gross`, discount: "—", value: formatInr(price.subtotal), strong: true },
    { title: `GST (${price.gstPercentage}%)`, rate: "—", weight: "—", discount: "—", value: formatInr(price.gstAmount), strong: false },
  ];
  return <section className={`overflow-hidden rounded-xl border border-[#e5dcc7] bg-white ${compact ? "" : "shadow-sm"}`}>
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[#efe8da] px-4 py-3"><div><h3 className="font-semibold text-[#26312b]">Transparent Price Breakdown</h3><p className="mt-1 text-xs text-slate-500">{rate.source} · {rate.sourceTimestamp ? new Date(rate.sourceTimestamp).toLocaleString() : "timestamp unavailable"}</p></div><span className={`rounded-full px-2.5 py-1 text-[11px] ${rate.overridden ? "bg-violet-50 text-violet-700" : rate.estimated ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-700"}`}>{rate.overridden ? "Jeweller rate" : rate.estimated ? "Purity-adjusted estimate" : "Reference rate"}</span></div>
    {!compact && <p className="border-b border-gray-100 bg-[#fbfaf7] px-4 py-2 text-xs text-slate-500">Tax treatment can vary. Confirm applicable GST before using this estimate for billing.</p>}
    <div className="overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead><tr className="bg-[#faf8f2] text-[11px] uppercase tracking-wide text-slate-500">{["Product Details", "Gold Rate", "Weight", "Discount", "Value"].map((label) => <th key={label} className="px-3 py-2.5 font-semibold">{label}</th>)}</tr></thead><tbody>{rows.map((row) => <tr key={row.title} className={`border-t border-gray-100 ${row.strong ? "bg-[#fcfbf8] font-semibold" : ""}`}><td className="px-3 py-2.5">{row.title}</td><td className="px-3 py-2.5 text-slate-500">{row.rate}</td><td className="px-3 py-2.5 text-slate-500">{row.weight}</td><td className="px-3 py-2.5 text-slate-500">{row.discount}</td><td className="px-3 py-2.5 text-right tabular-nums">{row.value}</td></tr>)}</tbody><tfoot><tr className="border-t-2 border-[#d5bc7d] bg-[#f7efd9]"><td colSpan={4} className="px-3 py-3 font-bold text-[#58451f]">Grand Total</td><td className="px-3 py-3 text-right text-lg font-bold tabular-nums text-[#58451f]">{formatInr(price.grandTotal)}</td></tr></tfoot></table></div>
    <div className="grid gap-2 border-t border-gray-100 bg-[#fcfbf8] px-4 py-3 text-xs sm:grid-cols-3"><p>Pricing mode: <strong>{price.pricingMode === "manual" ? "Manual selling price" : "Breakdown-derived selling price"}</strong></p><p>Actual price: <strong>{formatInr(price.actualPrice)}</strong></p><p>Fixed selling discount: <strong>−{formatInr(price.fixedDiscount)}</strong></p><p className="sm:col-span-3 text-sm text-[#34473d]">Discounted selling price: <strong>{formatInr(price.discountedPrice)}</strong></p></div>
  </section>;
}
