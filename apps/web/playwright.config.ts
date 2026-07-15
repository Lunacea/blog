import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "../../e2e",
  fullyParallel: true,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  forbidOnly: Boolean(Deno.env.get("CI")),
  retries: Deno.env.get("CI") ? 2 : 0,
  workers: Deno.env.get("CI") ? 2 : 4,
  reporter: Deno.env.get("CI") ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: Deno.env.get("E2E_BASE_URL") ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: Deno.env.get("E2E_BASE_URL") ? undefined : {
    command: "deno task dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/api/v1/health",
    reuseExistingServer: !Deno.env.get("CI"),
    timeout: 120_000,
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "no-javascript",
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
  ],
});
