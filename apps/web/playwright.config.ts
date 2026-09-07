import { defineConfig, devices } from "@playwright/test";

// Every test declares the surfaces it is about with an @desktop, @mobile or @nojs tag, and each
// project selects on that tag. Selecting rather than skipping inside the body means a test is
// never started, and no browser context is opened, for a project it does not apply to.
export default defineConfig({
  testDir: "../../e2e",
  globalSetup: Deno.env.get("E2E_BASE_URL") || Deno.env.get("E2E_PREVIEW")
    ? undefined
    : "./e2e-warmup.ts",
  fullyParallel: true,
  timeout: 45_000,
  expect: { timeout: 8_000 },
  forbidOnly: Boolean(Deno.env.get("CI")),
  retries: Deno.env.get("CI") ? 2 : 0,
  // Keep browser load comparable locally and in CI; only the dev server needs transform warm-up.
  workers: 2,
  reporter: Deno.env.get("CI") ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: Deno.env.get("E2E_BASE_URL") ?? "http://127.0.0.1:4173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: Deno.env.get("E2E_BASE_URL") ? undefined : {
    command: Deno.env.get("E2E_PREVIEW")
      ? "deno task preview --host 127.0.0.1 --port 4173"
      : "deno task dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/api/v1/health",
    reuseExistingServer: !Deno.env.get("CI") && !Deno.env.get("E2E_PREVIEW"),
    // Font and responsive-image generation precede Vite; cold CI filesystems can exceed two minutes.
    timeout: 180_000,
  },
  projects: [
    {
      name: "desktop",
      grep: /@desktop/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile",
      grep: /@mobile/,
      use: { ...devices["Pixel 7"] },
    },
    {
      name: "no-javascript",
      grep: /@nojs/,
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
  ],
});
