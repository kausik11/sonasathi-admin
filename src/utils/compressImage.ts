export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;

export const MAX_SOURCE_IMAGE_BYTES = 15 * 1024 * 1024;
export const MAX_IMAGE_DIMENSION = 1200;
export const WEBP_QUALITY = 0.76;

export async function compressImage(file: File): Promise<Blob> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
    throw new Error("Choose a JPG, PNG, WebP, or AVIF image.");
  }
  if (file.size === 0 || file.size > MAX_SOURCE_IMAGE_BYTES) {
    throw new Error("Image must be smaller than 15 MB.");
  }
  if (typeof window === "undefined" || typeof createImageBitmap === "undefined") {
    throw new Error("Image processing is only available in a supported browser.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be decoded by your browser.");
  }

  try {
    const scale = Math.min(1, MAX_IMAGE_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Your browser could not prepare the image.");
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    const webp = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (result) => {
          if (result?.type === "image/webp") resolve(result);
          else reject(new Error("Your browser could not convert this image to WebP."));
        },
        "image/webp",
        WEBP_QUALITY,
      );
    });
    return webp;
  } finally {
    bitmap.close();
  }
}
