import { expect, test } from "@playwright/test";

test("浏览器请求能命中 Mock handler", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /^(首页|登录)$/ })).toBeVisible();

  const response = await page.evaluate(async () => {
    const result = await fetch("/api/hello");
    return result.json();
  });

  expect(response).toEqual({ message: "Hello World" });
});
