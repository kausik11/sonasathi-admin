import { expect, test, type Page } from "@playwright/test";

async function signIn(page: Page, account: "Jeweller 1" | "Jeweller 2") {
  await page.goto("/");
  await page.getByRole("button", { name: new RegExp(account) }).click();
  await expect(page).toHaveURL(/jeweller\/dashboard$/);
  await page.goto("/jeweller/dashboard/products");
  await page.getByRole("heading", { name: "Jewellery Products" }).waitFor();
}

async function addProductWithImage(page: Page, productName: string) {
  await page.getByRole("button", { name: "Add product" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Jewellery name").fill(productName);
  await dialog.getByRole("combobox").nth(0).selectOption({ label: "Necklaces" });
  await dialog.getByLabel("Gold net weight (g)").fill("5.25");
  await dialog.getByLabel("Actual price (₹)").fill("45000");
  await page.getByRole("button", { name: "Save product to add photos" }).click();
  await expect(page.getByText("Product saved. Add photos below", { exact: false })).toBeVisible();
  const fileInput = page.getByLabel("Jewellery images (select one or more)").first();
  const pngData = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 2; canvas.height = 2; const context = canvas.getContext("2d")!; context.fillStyle = "#b89b62"; context.fillRect(0, 0, 2, 2); return canvas.toDataURL("image/png").split(",")[1]; });
  await fileInput.setInputFiles({ name: "test-ring.png", mimeType: "image/png", buffer: Buffer.from(pngData, "base64") });
  await expect(page.getByAltText("Selected jewellery preview 1")).toBeVisible();
  await page.getByRole("button", { name: "Save image" }).click();
  await expect(page.getByText("Photo saved to this listing.")).toBeVisible();
  await expect(page.getByAltText("test-ring.webp")).toBeVisible();
}

test("Jeweller 1 image persists across refresh and logout/login", async ({ page }) => {
  await signIn(page, "Jeweller 1");
  await addProductWithImage(page, "E2E Jeweller 1 Ring");
  await page.reload();
  await expect(page.getByText("E2E Jeweller 1 Ring")).toBeVisible();
  await page.getByRole("button", { name: "Edit" }).first().click();
  await expect(page.getByAltText("test-ring.webp")).toBeVisible();
  await page.getByRole("button", { name: "Close editor" }).click();
  await page.getByRole("button", { name: "Log out" }).first().click();
  await signIn(page, "Jeweller 1");
  await expect(page.getByText("E2E Jeweller 1 Ring")).toBeVisible();
  await page.getByRole("row").filter({ hasText: "E2E Jeweller 1 Ring" }).getByRole("button", { name: "Edit" }).click();
  await expect(page.getByAltText("test-ring.webp")).toBeVisible();
});

test("Jeweller 2 stores a separate image record and invalid file types are rejected", async ({ page }) => {
  await signIn(page, "Jeweller 2");
  await addProductWithImage(page, "E2E Jeweller 2 Ring");
  const fileInput = page.getByLabel("Jewellery images (select one or more)").first();
  const pngData = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 2; canvas.height = 2; const context = canvas.getContext("2d")!; context.fillStyle = "#536b5d"; context.fillRect(0, 0, 2, 2); return canvas.toDataURL("image/png").split(",")[1]; });
  await page.evaluate(() => { const original = Storage.prototype.setItem; Object.defineProperty(Storage.prototype, "setItem", { configurable: true, writable: true, value: function (this: Storage, key: string, value: string) { if (key === "sonasathi:jewellery-image-data:v1") throw new DOMException("Quota exceeded", "QuotaExceededError"); return original.call(this, key, value); } }); });
  await fileInput.setInputFiles({ name: "quota-test.png", mimeType: "image/png", buffer: Buffer.from(pngData, "base64") });
  await page.getByRole("button", { name: "Save image" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Browser storage is full" })).toBeVisible();
  await page.reload();
  await page.getByRole("row").filter({ hasText: "E2E Jeweller 2 Ring" }).getByRole("button", { name: "Edit" }).click();
  await expect(page.getByAltText("test-ring.webp")).toBeVisible();
  await page.getByRole("button", { name: "Close editor" }).click();
  await page.getByRole("row").filter({ hasText: "E2E Jeweller 2 Ring" }).getByRole("button", { name: "Edit" }).click();
  await fileInput.setInputFiles({ name: "bad.txt", mimeType: "text/plain", buffer: Buffer.from("not an image") });
  await page.getByRole("button", { name: "Save image" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Choose a JPG" })).toBeVisible();
  await page.reload();
  await expect(page.getByText("E2E Jeweller 2 Ring")).toBeVisible();
  await page.getByRole("row").filter({ hasText: "E2E Jeweller 2 Ring" }).getByRole("button", { name: "Edit" }).click();
  await expect(page.getByAltText("test-ring.webp")).toBeVisible();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(page.getByText("No images saved for this listing.")).toBeVisible();
});

test("published product detail displays transparent price breakdown", async ({ page }) => {
  await signIn(page, "Jeweller 1");
  await page.getByRole("button", { name: "Add product" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByLabel("Jewellery name").fill("E2E Published Pricing Ring");
  await dialog.getByRole("combobox").nth(0).selectOption({ label: "Rings" });
  await expect(dialog.getByRole("combobox", { name: "Ring size", exact: true })).toBeVisible();
  await dialog.getByRole("combobox", { name: "Ring size", exact: true }).selectOption({ label: "6" });
  await dialog.getByLabel("Status").selectOption("published");
  await dialog.getByLabel("Gold net weight (g)").fill("3.5");
  await dialog.getByLabel("Actual price (₹)").fill("30000");
  await page.getByRole("button", { name: "Save product to add photos" }).click();
  const photoData = await page.evaluate(() => { const canvas = document.createElement("canvas"); canvas.width = 2; canvas.height = 2; const context = canvas.getContext("2d")!; context.fillStyle = "#95764c"; context.fillRect(0, 0, 2, 2); return canvas.toDataURL("image/png").split(",")[1]; });
  await page.getByLabel("Jewellery images (select one or more)").first().setInputFiles([
    { name: "ring-front.png", mimeType: "image/png", buffer: Buffer.from(photoData, "base64") },
    { name: "ring-side.png", mimeType: "image/png", buffer: Buffer.from(photoData, "base64") },
  ]);
  await expect(page.getByAltText("Selected jewellery preview 1")).toBeVisible();
  await expect(page.getByAltText("Selected jewellery preview 2")).toBeVisible();
  await page.getByRole("button", { name: "Save 2 photos" }).click();
  await expect(page.getByAltText("ring-front.webp")).toBeVisible();
  await expect(page.getByAltText("ring-side.webp")).toBeVisible();
  await page.goto("/jeweller/dashboard/products");
  await page.getByRole("row").filter({ hasText: "E2E Published Pricing Ring" }).getByRole("button", { name: "View price breakdown" }).click();
  const [detail] = await Promise.all([page.waitForEvent("popup"), page.getByRole("link", { name: "Open public product detail preview" }).click()]);
  await expect(detail.getByText("22K Gold")).toBeVisible();
  await expect(detail.getByText("Ring size")).toBeVisible();
  await expect(detail.getByText("6", { exact: true })).toBeVisible();
  await expect(detail.getByRole("cell", { name: /GST/ })).toBeVisible();
});

test("Jeweller can set separate prices for each purity from the dropdown", async ({ page }) => {
  await signIn(page, "Jeweller 1");
  await page.goto("/jeweller/dashboard/gold-rates");
  const purity = page.getByLabel("Metal purity");
  const rate = page.getByLabel("Your price per gram (₹)");
  await expect(purity.locator("option")).toHaveCount(6);
  await purity.selectOption("18K");
  await rate.fill("8123.45");
  await page.getByRole("button", { name: "Save rate" }).click();
  await expect(page.getByRole("status").filter({ hasText: "18K rate saved" })).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "18K" }).getByText("Your custom rate")).toBeVisible();
  await purity.selectOption("22K");
  await rate.fill("9876.50");
  await page.getByRole("button", { name: "Save rate" }).click();
  await expect(page.getByRole("status").filter({ hasText: "22K rate saved" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("row").filter({ hasText: "18K" }).getByText("Your custom rate")).toBeVisible();
  await expect(page.getByRole("row").filter({ hasText: "22K" }).getByText("Your custom rate")).toBeVisible();
});

test("opening admin gold rates replaces the demo value with the IBJA response", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /Super Admin/ }).click();
  await expect(page).toHaveURL(/admin\/dashboard$/);
  await page.route("**/api/gold-rates/ibja", (route) => route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ success: true, rate24k: 13497.0209, source: "Metals.Dev / IBJA", sourceTimestamp: "2026-11-16T19:20:03.876Z", currency: "INR", unit: "g", message: "Live IBJA reference rate." }),
  }));
  await page.goto("/admin/dashboard/gold-rates");
  await expect(page.getByRole("status").filter({ hasText: "Updated IBJA reference rate" })).toBeVisible();
  await expect(page.getByText("₹13,497.02", { exact: true })).toBeVisible();
  await expect(page.getByText("Demo reference (24K sample, not live)")).toHaveCount(0);
});
