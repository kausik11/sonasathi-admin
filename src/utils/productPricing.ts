import type { GoldData, GoldOverride, Product } from "../services/dashboardDataService";

export const SUPPORTED_GOLD_PURITIES = ["9K", "10K", "14K", "18K", "22K", "24K"] as const;
export type SupportedGoldPurity = (typeof SUPPORTED_GOLD_PURITIES)[number];

export type AppliedGoldRate = {
  ratePerGram: number;
  source: string;
  sourceTimestamp: string;
  purity: string;
  estimated: boolean;
  overridden: boolean;
};

export type PriceBreakdown = {
  purity: string;
  netGoldWeight: number;
  grossWeight: number | null;
  ratePerGram: number;
  rateSource: string;
  sourceTimestamp: string;
  rateEstimated: boolean;
  goldValue: number;
  makingChargePercentage: number;
  baseMakingCharge: number;
  makingChargeDiscountPercentage: number;
  makingChargeDiscount: number;
  netMakingCharge: number;
  stoneCharges: number;
  breakdownDiscount: number;
  subtotal: number;
  gstPercentage: number;
  gstAmount: number;
  grandTotal: number;
  actualPrice: number;
  fixedDiscount: number;
  discountedPrice: number;
  pricingMode: "manual" | "breakdown";
};

export function roundCurrency(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function formatInr(value: number, perGram = false): string {
  const formatted = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(roundCurrency(value));
  return perGram ? `${formatted}/g` : formatted;
}

function karat(purity: string): number | null {
  const value = Number(purity.replace(/k$/i, ""));
  return Number.isFinite(value) && value > 0 && value <= 24 ? value : null;
}

export function getAppliedGoldRate(gold: GoldData, overrides: GoldOverride[], jewellerId: string, purity: string, at = Date.now()): AppliedGoldRate {
  const active = overrides
    .filter((item) => item.jewellerId === jewellerId && (item.purity ?? "24K") === purity && item.status !== "expired" && new Date(item.expiresAt).getTime() > at)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  if (active) return { ratePerGram: roundCurrency(active.rate24k), source: "Jeweller custom rate", sourceTimestamp: active.updatedAt, purity, estimated: false, overridden: true };

  const targetKarat = karat(purity);
  if (!targetKarat || !Number.isFinite(gold.referenceRate24k) || gold.referenceRate24k <= 0) {
    return { ratePerGram: 0, source: "No applicable gold rate", sourceTimestamp: gold.sourceTimestamp ?? gold.lastFetchedAt, purity, estimated: false, overridden: false };
  }
  const referencePurity = gold.referencePurityKarat ?? 24;
  const ratePerGram = roundCurrency(gold.referenceRate24k * targetKarat / referencePurity);
  return {
    ratePerGram,
    source: targetKarat === referencePurity ? (gold.source ?? "IBJA reference rate") : `${gold.source ?? "IBJA reference rate"} · purity-adjusted estimate`,
    sourceTimestamp: gold.sourceTimestamp ?? gold.lastFetchedAt,
    purity,
    estimated: targetKarat !== referencePurity,
    overridden: false,
  };
}

export function calculatePriceBreakdown(product: Pick<Product,
  "purity" | "weight" | "actualPrice" | "offerAmount" | "netGoldWeight" | "grossWeight" | "stoneCharges" | "fixedDiscount" |
  "makingChargePercentage" | "makingChargeDiscountPercentage" | "breakdownDiscount" | "gstPercentage" | "pricingMode"
>, appliedRate: AppliedGoldRate): PriceBreakdown {
  const netGoldWeight = Math.max(0, Number(product.netGoldWeight ?? product.weight) || 0);
  const grossWeight = product.grossWeight == null || product.grossWeight === 0 ? null : Math.max(0, Number(product.grossWeight) || 0);
  const goldValue = roundCurrency(appliedRate.ratePerGram * netGoldWeight);
  const makingChargePercentage = Math.max(0, Number(product.makingChargePercentage ?? 15) || 0);
  const makingChargeDiscountPercentage = Math.min(100, Math.max(0, Number(product.makingChargeDiscountPercentage ?? 0) || 0));
  const baseMakingCharge = roundCurrency(goldValue * makingChargePercentage / 100);
  const makingChargeDiscount = roundCurrency(baseMakingCharge * makingChargeDiscountPercentage / 100);
  const netMakingCharge = roundCurrency(baseMakingCharge - makingChargeDiscount);
  const stoneCharges = roundCurrency(Math.max(0, Number(product.stoneCharges ?? 0) || 0));
  const breakdownDiscount = roundCurrency(Math.max(0, Number(product.breakdownDiscount ?? 0) || 0));
  const subtotal = roundCurrency(Math.max(0, goldValue + netMakingCharge + stoneCharges - breakdownDiscount));
  const gstPercentage = Math.max(0, Number(product.gstPercentage ?? 3) || 0);
  const gstAmount = roundCurrency(subtotal * gstPercentage / 100);
  const grandTotal = roundCurrency(subtotal + gstAmount);
  const pricingMode = product.pricingMode ?? "manual";
  const actualPrice = pricingMode === "breakdown" ? grandTotal : roundCurrency(Math.max(0, Number(product.actualPrice) || 0));
  const fixedDiscount = roundCurrency(Math.min(actualPrice, Math.max(0, Number(product.fixedDiscount ?? product.offerAmount ?? 0) || 0)));
  const discountedPrice = roundCurrency(Math.max(0, actualPrice - fixedDiscount));

  return {
    purity: product.purity, netGoldWeight, grossWeight, ratePerGram: appliedRate.ratePerGram,
    rateSource: appliedRate.source, sourceTimestamp: appliedRate.sourceTimestamp, rateEstimated: appliedRate.estimated,
    goldValue, makingChargePercentage, baseMakingCharge, makingChargeDiscountPercentage, makingChargeDiscount,
    netMakingCharge, stoneCharges, breakdownDiscount, subtotal, gstPercentage, gstAmount, grandTotal,
    actualPrice, fixedDiscount, discountedPrice, pricingMode,
  };
}
