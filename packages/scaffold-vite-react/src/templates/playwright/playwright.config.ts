import { defineConfig, devices } from "@playwright/test";
import process from "node:process";

const host = "127.0.0.1";
const port = 5174;
const baseURL = `http://${host}:${port}`;

export default defineConfig({
  forbidOnly: Boolean(process.env.CI),
  fullyParallel: true,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
  reporter: "html",
  retries: process.env.CI ? 2 : 0,
  testDir: "./tests",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `pnpm exec vite --mode develop --host ${host} --port ${port} --strictPort`,
    env: { VITE_ENABLE_MOCK: "true" },
    url: baseURL,
  },
  workers: process.env.CI ? 1 : undefined,
});
