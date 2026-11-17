import { expect, test } from "@playwright/test";

for (const width of [320, 768, 1024]) {
  test(`dashboard fits a ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: "Sign in", exact: true })).toBeVisible();
    await page.getByRole("button", { name: /Super Admin/ }).click();
    await expect(page).toHaveURL(/admin\/dashboard$/);
    for (const section of ["", "accounts", "shop-profiles", "products", "images", "store-visits", "categories", "gold-rates", "visiting-hours", "settings"]) {
      await page.goto(`/admin/dashboard/${section}`);
      await expect(page.locator(".dashboard-content")).toBeVisible();
      await expect(page.locator(".dashboard-content h1").first()).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `page overflow in ${section || "overview"}`).toBeLessThanOrEqual(1);
    }
    await page.goto("/admin/dashboard/products");
    await page.getByRole("button", { name: "Add product", exact: true }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    expect(await dialog.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
    await page.getByRole("button", { name: "Close editor" }).click();
    await page.goto("/admin/dashboard/accounts");
    await page.getByRole("button", { name: "Add jeweller", exact: true }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await page.getByRole("button", { name: "Cancel", exact: true }).click();
    if (width < 1024) {
      await page.getByRole("button", { name: "Open navigation", exact: true }).click();
      await expect(page.getByRole("link", { name: "Jewellery Products", exact: true })).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toHaveAttribute("aria-expanded", "false");
    }
  });
}

test("collapsed desktop sidebar keeps labels when opened on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
  await page.getByRole("button", { name: /Super Admin/ }).click();
  await page.getByRole("button", { name: "Collapse sidebar" }).click();
  await page.setViewportSize({ width: 375, height: 800 });
  await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect(page.getByRole("link", { name: "Jewellery Products", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Jewellery Products", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Jewellery Products", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Open navigation", exact: true })).toHaveAttribute("aria-expanded", "false");
});
