export type ImageStorageMode = "indexeddb" | "localstorage";

export type JewelleryImage = {
  id: string;
  productId: string;
  jewellerId: string;
  name: string;
  mimeType: "image/webp";
  isPrimary: boolean;
  order: number;
  createdAt: number;
};

type StoredImage = { id: string; blob: Blob };

const DB_NAME = "sonasathi-jewellery-images";
const DB_VERSION = 1;
const STORE_NAME = "images";
const METADATA_KEY = "sonasathi:jewellery-image-metadata:v1";
const MODE_KEY = "sonasathi:jewellery-image-storage-mode";
const DEFAULT_MODE: ImageStorageMode = "localstorage";

function browserStorage() {
  if (typeof window === "undefined") throw new Error("Image storage is available only in the browser.");
  return window.localStorage;
}

function getMetadata(): JewelleryImage[] {
  try {
    const storage = browserStorage();
    const existing = storage.getItem(METADATA_KEY);
    if (existing) return JSON.parse(existing) as JewelleryImage[];
    const modular = storage.getItem("sonasathi:v1:product-images");
    if (!modular) return [];
    const images = JSON.parse(modular) as JewelleryImage[];
    storage.setItem(METADATA_KEY, JSON.stringify(images));
    return images;
  } catch {
    throw new Error("Saved image details could not be read. Browser storage may be unavailable.");
  }
}

function saveMetadata(images: JewelleryImage[]) {
  try {
    browserStorage().setItem(METADATA_KEY, JSON.stringify(images));
    try { browserStorage().setItem("sonasathi:v1:product-images", JSON.stringify(images)); } catch { /* The existing metadata key remains canonical. */ }
  } catch (error) {
    if (isQuotaError(error)) {
      throw new Error("Browser storage is full. Existing images were kept; remove some images or switch to IndexedDB.");
    }
    throw new Error("Image details could not be saved in browser storage.");
  }
}

function isQuotaError(error: unknown) {
  return error instanceof DOMException && (error.name === "QuotaExceededError" || error.name === "NS_ERROR_DOM_QUOTA_REACHED");
}

function openDatabase(): Promise<IDBDatabase> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.reject(new Error("IndexedDB is not available in this browser."));
  }
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open IndexedDB."));
  });
}

async function idbRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, mode);
      const request = action(transaction.objectStore(STORE_NAME));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error("IndexedDB operation failed."));
      transaction.onabort = () => reject(transaction.error ?? new Error("IndexedDB operation was interrupted."));
    });
  } finally {
    db.close();
  }
}

export function getImageStorageMode(): ImageStorageMode {
  try {
    return browserStorage().getItem(MODE_KEY) === "localstorage" ? "localstorage" : DEFAULT_MODE;
  } catch {
    return DEFAULT_MODE;
  }
}

export function setImageStorageMode(mode: ImageStorageMode) {
  browserStorage().setItem(MODE_KEY, mode);
}

export function listJewelleryImages(productId: string, jewellerId: string): JewelleryImage[] {
  return getMetadata()
    .filter((image) => image.productId === productId && image.jewellerId === jewellerId)
    .sort((a, b) => a.order - b.order || a.createdAt - b.createdAt);
}

export function listAllJewelleryImages(): JewelleryImage[] {
  return getMetadata().sort((a, b) => a.productId.localeCompare(b.productId) || a.order - b.order);
}

export async function saveJewelleryImage(input: {
  productId: string;
  jewellerId: string;
  name: string;
  blob: Blob;
  replaceId?: string;
  imageId?: string;
}): Promise<JewelleryImage> {
  const metadata = getMetadata();
  const existing = metadata.filter((image) => image.productId === input.productId && image.jewellerId === input.jewellerId);
  const replacementId = input.replaceId ?? input.imageId;
  const replaced = replacementId ? metadata.find((image) => image.id === replacementId && image.jewellerId === input.jewellerId && image.productId === input.productId) : undefined;
  if (input.replaceId && !replaced) throw new Error("The image to replace was not found.");
  const record: JewelleryImage = {
    id: replaced?.id ?? input.imageId ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `image-${Date.now()}-${Math.random().toString(36).slice(2)}`),
    productId: input.productId,
    jewellerId: input.jewellerId,
    name: input.name.replace(/\.[^.]+$/, "") + ".webp",
    mimeType: "image/webp",
    isPrimary: replaced?.isPrimary ?? existing.length === 0,
    order: replaced?.order ?? existing.length,
    createdAt: replaced?.createdAt ?? Date.now(),
  };

  if (getImageStorageMode() === "localstorage") {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => (typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Image conversion failed.")));
      reader.onerror = () => reject(new Error("Image could not be read."));
      reader.readAsDataURL(input.blob);
    });
    const nextMetadata = replaced ? metadata.map((image) => image.id === record.id ? record : image) : [...metadata, record];
    const storage = browserStorage();
    const previousData = storage.getItem("sonasathi:jewellery-image-data:v1");
    try {
      const all = JSON.parse(previousData ?? "{}") as Record<string, string>;
      all[record.id] = dataUrl;
      storage.setItem("sonasathi:jewellery-image-data:v1", JSON.stringify(all));
      saveMetadata(nextMetadata);
      await idbRequest<undefined>("readwrite", (store) => store.delete(record.id)).catch(() => undefined);
    } catch (error) {
      try {
        if (previousData === null) storage.removeItem("sonasathi:jewellery-image-data:v1");
        else storage.setItem("sonasathi:jewellery-image-data:v1", previousData);
      } catch { /* Keep the original quota error; no existing image is intentionally removed. */ }
      if (isQuotaError(error)) throw new Error("Browser storage is full. Existing images were kept; remove some images or switch to IndexedDB.");
      throw error;
    }
    return record;
  }

  const previousBinary = replaced
    ? await idbRequest<StoredImage | undefined>("readonly", (store) => store.get(record.id))
    : undefined;
  await idbRequest<IDBValidKey>("readwrite", (store) => store.put({ id: record.id, blob: input.blob } satisfies StoredImage));
  try {
    saveMetadata(replaced ? metadata.map((image) => image.id === record.id ? record : image) : [...metadata, record]);
  } catch (error) {
    if (previousBinary) {
      await idbRequest<IDBValidKey>("readwrite", (store) => store.put(previousBinary)).catch(() => undefined);
    } else {
      await deleteBinary(record.id).catch(() => undefined);
    }
    throw error;
  }
  return record;
}

async function deleteBinary(id: string) {
  if (getImageStorageMode() === "localstorage") {
    const data = JSON.parse(browserStorage().getItem("sonasathi:jewellery-image-data:v1") ?? "{}") as Record<string, string>;
    delete data[id];
    browserStorage().setItem("sonasathi:jewellery-image-data:v1", JSON.stringify(data));
    await idbRequest<undefined>("readwrite", (store) => store.delete(id)).catch(() => undefined);
  } else {
    await idbRequest<undefined>("readwrite", (store) => store.delete(id));
  }
}

export async function getJewelleryImageUrl(id: string): Promise<string | null> {
  if (getImageStorageMode() === "localstorage") {
    const value = JSON.parse(browserStorage().getItem("sonasathi:jewellery-image-data:v1") ?? "{}") as Record<string, string>;
    if (value[id]) return value[id];
    // Migrate binary records written by the previous IndexedDB-default demo without dropping them on quota errors.
    const legacy = await idbRequest<StoredImage | undefined>("readonly", (store) => store.get(id)).catch(() => undefined);
    if (!legacy) return null;
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Could not restore a saved image."));
      reader.onerror = () => reject(new Error("Could not restore a saved image."));
      reader.readAsDataURL(legacy.blob);
    });
    try {
      value[id] = dataUrl;
      browserStorage().setItem("sonasathi:jewellery-image-data:v1", JSON.stringify(value));
      await idbRequest<undefined>("readwrite", (store) => store.delete(id)).catch(() => undefined);
      return dataUrl;
    } catch {
      return URL.createObjectURL(legacy.blob);
    }
  }
  const stored = await idbRequest<StoredImage | undefined>("readonly", (store) => store.get(id));
  return stored ? URL.createObjectURL(stored.blob) : null;
}

export async function deleteJewelleryImage(id: string, jewellerId: string) {
  const metadata = getMetadata();
  const target = metadata.find((image) => image.id === id && image.jewellerId === jewellerId);
  if (!target) return;
  await deleteBinary(id);
  const remaining = metadata.filter((image) => image.id !== id);
  if (target.isPrimary) {
    const next = remaining
      .filter((image) => image.productId === target.productId && image.jewellerId === jewellerId)
      .sort((a, b) => a.order - b.order)[0];
    if (next) next.isPrimary = true;
  }
  saveMetadata(remaining);
}

export async function updateJewelleryImages(productId: string, jewellerId: string, orderedIds: string[], primaryId: string) {
  const metadata = getMetadata();
  const scoped = metadata.filter((image) => image.productId === productId && image.jewellerId === jewellerId);
  if (orderedIds.length !== scoped.length || orderedIds.some((id) => !scoped.some((image) => image.id === id)) || !orderedIds.includes(primaryId)) {
    throw new Error("Image order or primary image selection is invalid.");
  }
  const positions = new Map(orderedIds.map((id, index) => [id, index]));
  saveMetadata(metadata.map((image) => image.productId === productId && image.jewellerId === jewellerId
    ? { ...image, order: positions.get(image.id)!, isPrimary: image.id === primaryId }
    : image));
}

export async function deleteProductJewelleryImages(productId: string, jewellerId: string) {
  const records = listJewelleryImages(productId, jewellerId);
  for (const record of records) await deleteBinary(record.id);
  const ids = new Set(records.map((image) => image.id));
  saveMetadata(getMetadata().filter((image) => !ids.has(image.id)));
}

export async function deleteAllJewelleryImages() {
  const records = getMetadata();
  for (const record of records) await deleteBinary(record.id);
  saveMetadata([]);
  if (getImageStorageMode() === "localstorage") browserStorage().setItem("sonasathi:jewellery-image-data:v1", "{}");
}

export async function deleteJewellerJewelleryImages(jewellerId: string) {
  const records = getMetadata().filter((image) => image.jewellerId === jewellerId);
  for (const record of records) await deleteBinary(record.id);
  const ids = new Set(records.map((image) => image.id));
  saveMetadata(getMetadata().filter((image) => !ids.has(image.id)));
}
