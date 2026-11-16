import { deleteProductJewelleryImages, getJewelleryImageUrl, listAllJewelleryImages, listJewelleryImages, saveJewelleryImage } from "./imageStorageService";
import { SONASATHI_CATEGORIES } from "../utils/productCategoryFields";
export { listJewelleryImages as getProductImages, saveJewelleryImage as saveProductImage, deleteJewelleryImage as deleteProductImage, updateJewelleryImages as updateProductImages } from "./imageStorageService";
export { listJewelleryImages, getJewelleryImageUrl } from "./imageStorageService";

export type AccountStatus = "active" | "inactive";
export type ListingStatus = "draft" | "published" | "unpublished";
export type VisitStatus = "New" | "Contacted" | "Confirmed" | "Visited" | "Completed" | "Cancelled";

export type ShopProfile = {
  shopName: string; ownerName: string; address: string; city: string; pin: string;
  phone: string; whatsapp: string; email: string; description: string; logoData?: string; bannerData?: string;
  state?: string; status?: AccountStatus; productCategories?: string[];
};
export type Jeweller = {
  id: string; name: string; email: string; phone: string; password?: string; status: AccountStatus; shop: ShopProfile; createdAt: string;
};
export type Product = {
  id: string; jewellerId: string; name: string; category: string; purity: string; weight: number;
  actualPrice: number; offerAmount: number; status: ListingStatus; description: string; createdAt: string;
  productAttributes?: Record<string, string | number | boolean>;
  huid?: string; huid2?: string; netGoldWeight?: number; grossWeight?: number; stoneName?: string; stoneDetails?: string;
  stoneCharges?: number; fixedDiscount?: number; makingChargePercentage?: number; makingChargeDiscountPercentage?: number;
  breakdownDiscount?: number; gstPercentage?: number; pricingMode?: "manual" | "breakdown"; goldRateSource?: string; goldRateTimestamp?: string;
};
export type StoreVisit = {
  id: string; customerName: string; mobile: string; email: string; productId: string; jewellerId: string;
  date: string; time: string; message: string; status: VisitStatus; createdAt: string;
};
export type Category = { id: string; name: string; description: string; active: boolean };
export type GoldOverride = { id?: string; jewellerId: string; purity?: string; rate24k: number; updatedAt: string; expiresAt: string; status?: "active" | "expired"; endReason?: "replaced" | "timeout" };
export type GoldFetch = { id: string; rate24k: number | null; source: string; success: boolean; message: string; fetchedAt: string; sourceTimestamp?: string; currency?: string; unit?: string };
export type GoldData = { referenceRate24k: number; lastFetchedAt: string; fetchTimes: [string, string]; history: GoldFetch[]; overrides: GoldOverride[]; source?: string; sourceTimestamp?: string; currency?: string; unit?: string; referencePurityKarat?: number };
export type DaySchedule = { day: string; closed: boolean; intervals: { open: string; close: string }[] };
export type SpecialDate = { date: string; label: string; closed: boolean; intervals: { open: string; close: string }[] };
export type VisitingHours = { jewellerId: string; week: DaySchedule[]; holidays: string[]; specialDates: SpecialDate[] };
export type Activity = { id: string; label: string; jewellerId?: string; createdAt: string };
export type DemoData = {
  version: 1; jewellers: Jeweller[]; products: Product[]; visits: StoreVisit[]; categories: Category[];
  gold: GoldData; visitingHours: VisitingHours[]; settings: { currency: string; timezone: string; compactTables: boolean; notifications: boolean };
  activity: Activity[];
};

const DATA_KEY = "sonasathi:dashboard-data:v1";
const MODULE_KEYS = {
  jewellers: "sonasathi:v1:jewellers", products: "sonasathi:v1:products", categories: "sonasathi:v1:categories",
  images: "sonasathi:v1:product-images", goldReference: "sonasathi:v1:gold-reference", goldOverrides: "sonasathi:v1:gold-overrides",
  goldLogs: "sonasathi:v1:gold-fetch-logs", visitingHours: "sonasathi:v1:visiting-hours", specialDates: "sonasathi:v1:special-dates",
  visits: "sonasathi:v1:store-visit-queries", settings: "sonasathi:v1:settings",
} as const;
const now = () => new Date().toISOString();
const createId = (prefix: string) => `${prefix}-${typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`}`;

function makeShop(id: string, shopName: string, ownerName: string, email: string, phone: string, city: string): ShopProfile {
  return { shopName, ownerName, email, phone, whatsapp: phone, address: "12 Market Road", city, state: city === "Bengaluru" ? "Karnataka" : "Maharashtra", pin: "560001", description: `${shopName} showcases fine jewellery and trusted craftsmanship.`, status: "active", productCategories: [] };
}

function seedData(): DemoData {
  const jewellers: Jeweller[] = [
    { id: "jeweller-001", name: "Aarav Mehta", email: "jeweller1@sonasathi.demo", phone: "+91 98765 43210", password: "Jeweller@12345", status: "active", shop: makeShop("jeweller-001", "Luxe Jewels", "Aarav Mehta", "jeweller1@sonasathi.demo", "+91 98765 43210", "Bengaluru"), createdAt: now() },
    { id: "jeweller-002", name: "Diya Shah", email: "jeweller2@sonasathi.demo", phone: "+91 98765 12340", password: "Jeweller@12345", status: "active", shop: makeShop("jeweller-002", "Sona Heritage", "Diya Shah", "jeweller2@sonasathi.demo", "+91 98765 12340", "Mumbai"), createdAt: now() },
  ];
  const productNames = ["Gold Necklace", "Temple Jhumkas", "Diamond Ring", "Filigree Bangles", "Pearl Pendant", "Bridal Choker", "Kundan Earrings", "Gold Chain", "Emerald Bracelet", "Traditional Waist Belt", "Rose Gold Studs", "Polki Pendant"];
  const products: Product[] = productNames.flatMap((name, index) => ["jeweller-001", "jeweller-002"].map((jewellerId, ownerIndex) => ({
    id: `product-${String(index * 2 + ownerIndex + 1).padStart(3, "0")}`, jewellerId, name: ownerIndex === 0 ? name : `${name} Collection`,
    category: ["Necklaces", "Earrings", "Rings", "Bangles"][index % 4], purity: index % 3 === 0 ? "22K" : "18K", weight: 6.5 + index * 1.3,
    actualPrice: 18500 + index * 4800, offerAmount: index % 3 === 0 ? 500 : 0, status: index < 9 ? "published" as const : "draft" as const,
    description: "A carefully crafted piece for everyday elegance and special occasions.", createdAt: now(), netGoldWeight: 6.5 + index * 1.3,
    grossWeight: 7 + index * 1.3, huid: "", huid2: "", stoneName: "", stoneDetails: "", stoneCharges: 0,
    fixedDiscount: index % 3 === 0 ? 500 : 0, makingChargePercentage: 15, makingChargeDiscountPercentage: 10,
    breakdownDiscount: 0, gstPercentage: 3, pricingMode: "manual" as const,
  })));
  const visits: StoreVisit[] = Array.from({ length: 7 }, (_, i) => ({
    id: `visit-${String(i + 1).padStart(3, "0")}`, customerName: ["Priya Sharma", "Rohan Iyer", "Meera Patel", "Ananya Rao", "Kabir Jain", "Sana Khan", "Nisha Das"][i],
    mobile: `+91 90000 0000${i + 1}`, email: `customer${i + 1}@example.demo`, productId: products[i * 2].id, jewellerId: jewellers[i % 2].id,
    date: new Date(Date.now() + (i + 1) * 86400000).toISOString().slice(0, 10), time: "11:30", message: "I would like to see this piece in person.",
    status: (["New", "Contacted", "Confirmed", "New", "Visited", "New", "Completed"] as VisitStatus[])[i], createdAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
  const categories: Category[] = SONASATHI_CATEGORIES.map((name, i) => ({ id: `category-${i + 1}`, name, description: `${name} collection`, active: true }));
  const week = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day, i) => ({ day, closed: i === 6, intervals: i === 6 ? [] : [{ open: "10:00", close: "19:00" }] }));
  return {
    version: 1, jewellers, products, visits, categories,
    gold: { referenceRate24k: 7480, lastFetchedAt: now(), sourceTimestamp: now(), source: "Demo reference (24K sample, not live)", currency: "INR", unit: "g", referencePurityKarat: 24, fetchTimes: ["10:00", "16:00"], history: [{ id: "fetch-seed", rate24k: 7480, source: "Demo reference (24K sample, not live)", sourceTimestamp: now(), currency: "INR", unit: "g", success: true, message: "Sample input only; not a live IBJA quotation.", fetchedAt: now() }], overrides: [] },
    visitingHours: jewellers.map((jeweller) => ({ jewellerId: jeweller.id, week: structuredClone(week), holidays: [], specialDates: [] })),
    settings: { currency: "INR", timezone: "Asia/Kolkata", compactTables: false, notifications: true },
    activity: [
      { id: "activity-1", label: "Gold Necklace added", jewellerId: "jeweller-001", createdAt: now() },
      { id: "activity-2", label: "New store visit request", jewellerId: "jeweller-002", createdAt: now() },
      { id: "activity-3", label: "Jeweller account activated", jewellerId: "jeweller-001", createdAt: now() },
    ],
  };
}

function storage(): Storage {
  if (typeof window === "undefined") throw new Error("Dashboard data is available in the browser only.");
  return window.localStorage;
}

function parseModule<T>(key: string): T | null {
  const raw = storage().getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw) as T; }
  catch { throw new Error(`Saved Sonasathi data in ${key} is unreadable. Export or repair the browser data before continuing.`); }
}

function loadModuleData(): DemoData | null {
  const store = storage();
  if (!Object.values(MODULE_KEYS).some((key) => store.getItem(key) !== null)) return null;
  const seeded = seedData();
  const reference = parseModule<Partial<GoldData>>(MODULE_KEYS.goldReference);
  const overrides = parseModule<GoldOverride[]>(MODULE_KEYS.goldOverrides);
  const logs = parseModule<GoldFetch[]>(MODULE_KEYS.goldLogs);
  const visitingHours = parseModule<VisitingHours[]>(MODULE_KEYS.visitingHours);
  const specialDates = parseModule<Array<{ jewellerId: string; holidays: string[]; dates: SpecialDate[] }>>(MODULE_KEYS.specialDates);
  const hours = visitingHours ?? seeded.visitingHours;
  if (specialDates) for (const special of specialDates) {
    const item = hours.find((entry) => entry.jewellerId === special.jewellerId);
    if (item) { item.holidays = special.holidays; item.specialDates = special.dates; }
  }
  return {
    ...seeded,
    jewellers: parseModule<Jeweller[]>(MODULE_KEYS.jewellers) ?? seeded.jewellers,
    products: parseModule<Product[]>(MODULE_KEYS.products) ?? seeded.products,
    categories: parseModule<Category[]>(MODULE_KEYS.categories) ?? seeded.categories,
    visits: parseModule<StoreVisit[]>(MODULE_KEYS.visits) ?? seeded.visits,
    gold: { ...seeded.gold, ...reference, overrides: overrides ?? reference?.overrides ?? [], history: logs ?? reference?.history ?? seeded.gold.history },
    visitingHours: hours,
    settings: parseModule<DemoData["settings"]>(MODULE_KEYS.settings) ?? seeded.settings,
  };
}

function normalizeDemoData(input: DemoData): DemoData {
  const existingCategories = input.categories ?? [];
  const knownCategoryNames = new Set(existingCategories.map((category) => category.name.trim().toLocaleLowerCase()));
  const categories = [...existingCategories, ...SONASATHI_CATEGORIES.filter((name) => !knownCategoryNames.has(name.toLocaleLowerCase())).map((name) => ({ id: createId("category"), name, description: `${name} collection`, active: true }))];
  const normalized = {
    ...input,
    categories,
    jewellers: input.jewellers.map((jeweller) => ({
      ...jeweller,
      shop: { ...jeweller.shop, state: jeweller.shop.state ?? "", status: jeweller.shop.status ?? jeweller.status ?? "active", productCategories: jeweller.shop.productCategories ?? [] },
    })),
    products: input.products.map((product) => ({
      ...product,
      productAttributes: product.productAttributes ?? {},
      netGoldWeight: product.netGoldWeight ?? product.weight,
      fixedDiscount: product.fixedDiscount ?? product.offerAmount ?? 0,
      grossWeight: product.grossWeight ?? undefined,
      huid: product.huid ?? "", huid2: product.huid2 ?? "", stoneName: product.stoneName ?? "", stoneDetails: product.stoneDetails ?? "",
      stoneCharges: product.stoneCharges ?? 0, makingChargePercentage: product.makingChargePercentage ?? 15,
      makingChargeDiscountPercentage: product.makingChargeDiscountPercentage ?? 0, breakdownDiscount: product.breakdownDiscount ?? 0,
      gstPercentage: product.gstPercentage ?? 3, pricingMode: product.pricingMode ?? "manual",
    })),
    visits: input.visits.map((visit) => ({ ...visit, status: (visit.status === ("Visit Scheduled" as VisitStatus) ? "Confirmed" : visit.status) as VisitStatus })),
    gold: {
      ...input.gold,
      source: input.gold.source ?? "Demo reference (24K sample, not live)",
      sourceTimestamp: input.gold.sourceTimestamp ?? input.gold.lastFetchedAt,
      currency: input.gold.currency ?? "INR", unit: input.gold.unit ?? "g", referencePurityKarat: input.gold.referencePurityKarat ?? 24,
      overrides: input.gold.overrides.map((override) => ({
        ...override, id: override.id ?? createId("override"), purity: override.purity ?? "24K",
        status: override.status ?? (new Date(override.expiresAt).getTime() > Date.now() ? "active" as const : "expired" as const),
      })),
      history: input.gold.history.map((entry) => ({ ...entry, sourceTimestamp: entry.sourceTimestamp ?? entry.fetchedAt, currency: entry.currency ?? "INR", unit: entry.unit ?? "g" })),
    },
    version: 1 as const,
  } satisfies DemoData;
  normalized.gold.overrides = normalized.gold.overrides.map((override) => override.status === "active" && new Date(override.expiresAt).getTime() <= Date.now() ? { ...override, status: "expired" as const, endReason: "timeout" as const } : override);
  return normalized;
}

function writeModuleMirrors(data: DemoData) {
  const store = storage();
  const mirrors: Array<[string, unknown]> = [
    [MODULE_KEYS.jewellers, data.jewellers], [MODULE_KEYS.products, data.products], [MODULE_KEYS.categories, data.categories],
    [MODULE_KEYS.goldReference, { referenceRate24k: data.gold.referenceRate24k, lastFetchedAt: data.gold.lastFetchedAt, source: data.gold.source, sourceTimestamp: data.gold.sourceTimestamp, currency: data.gold.currency, unit: data.gold.unit, referencePurityKarat: data.gold.referencePurityKarat, fetchTimes: data.gold.fetchTimes }],
    [MODULE_KEYS.goldOverrides, data.gold.overrides], [MODULE_KEYS.goldLogs, data.gold.history],
    [MODULE_KEYS.visitingHours, data.visitingHours],
    [MODULE_KEYS.specialDates, data.visitingHours.map((hours) => ({ jewellerId: hours.jewellerId, holidays: hours.holidays, dates: hours.specialDates }))],
    [MODULE_KEYS.visits, data.visits], [MODULE_KEYS.settings, data.settings],
  ];
  for (const [key, value] of mirrors) {
    try { store.setItem(key, JSON.stringify(value)); }
    catch { /* The canonical versioned record is already safe; mirrors are best-effort compatibility keys. */ }
  }
  try {
    const images = JSON.parse(store.getItem("sonasathi:jewellery-image-metadata:v1") ?? "[]") as unknown;
    store.setItem(MODULE_KEYS.images, JSON.stringify(images));
  } catch { /* Keep image metadata in its original store if this optional mirror fails. */ }
}

export function getDashboardData(): DemoData {
  const store = storage();
  let raw: string | null;
  try { raw = store.getItem(DATA_KEY); }
  catch { throw new Error("Browser storage is unavailable. Check your browser privacy settings."); }
  if (!raw) {
    const initial = loadModuleData() ?? seedData();
    saveDashboardData(initial);
    return initial;
  }
  try {
    const parsed = JSON.parse(raw) as DemoData;
    if (parsed.version !== 1 || !Array.isArray(parsed.jewellers) || !Array.isArray(parsed.products)) throw new Error("Unsupported data format.");
    const normalized = normalizeDemoData(parsed);
    if (JSON.stringify(normalized) !== raw) saveDashboardData(normalized);
    return normalized;
  } catch {
    throw new Error("Saved Sonasathi data is unreadable. Export or clear the damaged browser data from Settings.");
  }
}

export function saveDashboardData(data: DemoData): void {
  if (data.version !== 1) throw new Error("Unsupported Sonasathi data version.");
  try { storage().setItem(DATA_KEY, JSON.stringify(data)); writeModuleMirrors(data); }
  catch (error) {
    if (error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED")) {
      throw new Error("Browser storage is full. Existing data was kept; export a backup or remove unused images.");
    }
    throw new Error("Sonasathi data could not be saved in this browser.");
  }
}

function updateData(mutator: (data: DemoData) => DemoData): DemoData {
  const next = mutator(getDashboardData());
  saveDashboardData(next);
  return next;
}

export const getJewellers = () => getDashboardData().jewellers;
export function saveJeweller(jeweller: Jeweller) { return updateData((data) => ({ ...data, jewellers: data.jewellers.some((item) => item.id === jeweller.id) ? data.jewellers.map((item) => item.id === jeweller.id ? jeweller : item) : [...data.jewellers, jeweller] })); }
export function saveShopProfile(jewellerId: string, shop: ShopProfile) {
  const jeweller = getJewellers().find((item) => item.id === jewellerId);
  if (!jeweller) throw new Error("The shop owner was not found.");
  return saveJeweller({ ...jeweller, name: shop.ownerName, email: shop.email, phone: shop.phone, shop });
}
export const getProducts = () => getDashboardData().products;
export function saveProduct(product: Product) { return updateData((data) => ({ ...data, products: data.products.some((item) => item.id === product.id) ? data.products.map((item) => item.id === product.id ? product : item) : [product, ...data.products], activity: [{ id: createId("activity"), label: `${product.name} ${data.products.some((item) => item.id === product.id) ? "updated" : "added"}`, jewellerId: product.jewellerId, createdAt: now() }, ...data.activity] })); }
export async function deleteProduct(productId: string, jewellerId: string) { await deleteProductJewelleryImages(productId, jewellerId); return updateData((data) => ({ ...data, products: data.products.filter((product) => product.id !== productId || product.jewellerId !== jewellerId), visits: data.visits.map((visit) => visit.productId === productId && visit.jewellerId === jewellerId ? { ...visit, productId: "" } : visit) })); }
export const getStoreVisits = () => getDashboardData().visits;
export function saveStoreVisit(visit: StoreVisit) { return updateData((data) => ({ ...data, visits: data.visits.some((item) => item.id === visit.id) ? data.visits.map((item) => item.id === visit.id ? visit : item) : [visit, ...data.visits] })); }
export function updateVisitStatus(id: string, status: VisitStatus) { return updateData((data) => ({ ...data, visits: data.visits.map((visit) => visit.id === id ? { ...visit, status } : visit) })); }
export const getCategories = () => getDashboardData().categories;
export function saveCategory(category: Category) { return updateData((data) => ({ ...data, categories: data.categories.some((item) => item.id === category.id) ? data.categories.map((item) => item.id === category.id ? category : item) : [...data.categories, category] })); }
export function deleteCategory(id: string) { return updateData((data) => ({ ...data, categories: data.categories.filter((item) => item.id !== id) })); }
export function getGoldRates() {
  return getDashboardData().gold;
}
export function refreshGoldOverrideExpiry(at = Date.now()): boolean {
  const store = storage();
  const raw = store.getItem(DATA_KEY);
  if (!raw) return false;
  const data = JSON.parse(raw) as DemoData;
  let changed = false;
  const overrides = data.gold.overrides.map((item) => {
    if (item.status !== "expired" && new Date(item.expiresAt).getTime() <= at) {
      changed = true;
      return { ...item, status: "expired" as const, endReason: "timeout" as const };
    }
    return item;
  });
  if (changed) saveDashboardData({ ...data, gold: { ...data.gold, overrides } });
  return changed;
}
export function saveReferenceGoldRate(rate24k: number, source = "Manual admin reference") {
  if (!Number.isFinite(rate24k) || rate24k <= 0) throw new Error("Reference gold rate must be greater than zero.");
  const timestamp = now();
  return updateData((data) => ({ ...data, gold: { ...data.gold, referenceRate24k: rate24k, source, sourceTimestamp: timestamp, lastFetchedAt: timestamp, history: [{ id: createId("fetch"), rate24k, source, sourceTimestamp: timestamp, currency: "INR", unit: "g", success: true, message: "Reference rate manually updated", fetchedAt: timestamp }, ...data.gold.history] } }));
}
export function getActiveGoldRateOverride(jewellerId: string, purity: string, at = Date.now()) {
  return getDashboardData().gold.overrides.filter((item) => item.jewellerId === jewellerId && (item.purity ?? "24K") === purity && item.status !== "expired" && new Date(item.expiresAt).getTime() > at).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0] ?? null;
}
export function saveGoldRateOverride(jewellerId: string, purityOrRate: string | number, customRate?: number) {
  const purity = typeof purityOrRate === "number" ? "24K" : purityOrRate;
  const rate24k = typeof purityOrRate === "number" ? purityOrRate : customRate;
  if (!rate24k || !Number.isFinite(rate24k) || rate24k <= 0) throw new Error("Custom gold rate must be greater than zero.");
  const at = Date.now();
  const createdAt = new Date(at).toISOString();
  const expiresAt = new Date(at + 24 * 60 * 60 * 1000).toISOString();
  return updateData((data) => ({ ...data, gold: { ...data.gold, overrides: [
    ...data.gold.overrides.map((item) => item.jewellerId === jewellerId && (item.purity ?? "24K") === purity && item.status !== "expired" && new Date(item.expiresAt).getTime() > at ? { ...item, status: "expired" as const, endReason: "replaced" as const, expiresAt: createdAt } : item),
    { id: createId("override"), jewellerId, purity, rate24k, updatedAt: createdAt, expiresAt, status: "active" as const },
  ] } }));
}
export function recordGoldFetch(result: Omit<GoldFetch, "id" | "fetchedAt">) {
  const fetchedAt = now();
  return updateData((data) => ({ ...data, gold: {
    ...data.gold,
    referenceRate24k: result.success && result.rate24k ? result.rate24k : data.gold.referenceRate24k,
    lastFetchedAt: result.success ? fetchedAt : data.gold.lastFetchedAt,
    source: result.success ? result.source : data.gold.source,
    sourceTimestamp: result.success ? result.sourceTimestamp ?? fetchedAt : data.gold.sourceTimestamp,
    currency: result.currency ?? data.gold.currency ?? "INR", unit: result.unit ?? data.gold.unit ?? "g",
    history: [{ ...result, id: createId("fetch"), fetchedAt, sourceTimestamp: result.sourceTimestamp ?? fetchedAt, currency: result.currency ?? "INR", unit: result.unit ?? "g" }, ...data.gold.history],
  } }));
}
export function saveGoldFetchTimes(times: [string, string]) {
  if (times.some((time) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) || times[0] === times[1]) throw new Error("Choose two different valid fetch times.");
  return updateData((data) => ({ ...data, gold: { ...data.gold, fetchTimes: times } }));
}
export const getVisitingHours = () => getDashboardData().visitingHours;
export function saveVisitingHours(hours: VisitingHours) { return updateData((data) => ({ ...data, visitingHours: data.visitingHours.some((item) => item.jewellerId === hours.jewellerId) ? data.visitingHours.map((item) => item.jewellerId === hours.jewellerId ? hours : item) : [...data.visitingHours, hours] })); }
export function saveSettings(settings: DemoData["settings"]) { return updateData((data) => ({ ...data, settings })); }
export async function createExport(): Promise<string> {
  const data = getDashboardData();
  const images = [] as Array<ReturnType<typeof listJewelleryImages>[number] & { imageData: string }>;
  for (const image of listAllJewelleryImages()) {
    const url = await getJewelleryImageUrl(image.id);
    if (!url) continue;
    let imageData = url;
    if (!url.startsWith("data:")) {
      try {
        const blob = await fetch(url).then((response) => response.blob());
        imageData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader(); reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not read an image for the backup.")); reader.onerror = () => reject(new Error("Could not read an image for the backup.")); reader.readAsDataURL(blob);
        });
      } finally { URL.revokeObjectURL(url); }
    }
    images.push({ ...image, imageData });
  }
  return JSON.stringify({ version: 1, data, images }, null, 2);
}
export async function importData(json: string) {
  const parsed = JSON.parse(json) as { version?: number; data?: DemoData; images?: Array<ReturnType<typeof listJewelleryImages>[number] & { imageData: string }> } & Partial<DemoData>;
  const value = parsed.data ?? parsed as DemoData;
  if (value.version !== 1 || !Array.isArray(value.jewellers) || !Array.isArray(value.products) || !Array.isArray(value.visits) || !Array.isArray(value.categories)) throw new Error("This file is not a supported Sonasathi backup.");
  saveDashboardData(value);
  for (const image of parsed.images ?? []) {
    if (!image.imageData.startsWith("data:image/webp;base64,")) continue;
    const raw = atob(image.imageData.slice(image.imageData.indexOf(",") + 1));
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    await saveJewelleryImage({ productId: image.productId, jewellerId: image.jewellerId, name: image.name, blob: new Blob([bytes], { type: "image/webp" }), imageId: image.id });
  }
  return value;
}
export function restoreSeedData() { const initial = seedData(); saveDashboardData(initial); return initial; }
export function clearDashboardData() { storage().removeItem(DATA_KEY); }
export function getStorageUsage() {
  const store = storage(); let used = 0;
  for (let i = 0; i < store.length; i++) { const key = store.key(i); const value = key ? store.getItem(key) ?? "" : ""; used += ((key?.length ?? 0) + value.length) * 2; }
  return used;
}
