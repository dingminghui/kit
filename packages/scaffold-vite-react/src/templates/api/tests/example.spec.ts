import { expect, test } from "@playwright/test";
import { TOKEN_KEY } from "../src/utils/token";

test("匿名访问首页时跳转到登录页", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL("/login");
  await expect(page.getByRole("heading", { name: "登录" })).toBeVisible();
});

test("已有会话时可以从首页导航到关于页面", async ({ page }) => {
  await page.addInitScript((key) => localStorage.setItem(key, "playwright-test-token"), TOKEN_KEY);
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "首页" })).toBeVisible();
  await page.getByRole("link", { name: "关于页面" }).click();
  await expect(page.getByRole("heading", { name: "关于" })).toBeVisible();
});
