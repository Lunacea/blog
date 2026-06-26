import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: [["html", { host: "0.0.0.0", port: 9323 }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  // Playwright UI Mode 用の設定をファイル内に集約
  webServer: {
    command: "deno task dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
