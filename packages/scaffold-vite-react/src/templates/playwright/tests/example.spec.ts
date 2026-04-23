import { expect, test } from "@playwright/test";

test("首页应该正常显示", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "首页" })).toBeVisible();
});

test("应该能导航到关于页面", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "关于页面" }).click();
  await expect(page.getByRole("heading", { name: "关于" })).toBeVisible();
});
