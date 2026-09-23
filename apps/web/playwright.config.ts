import { defineConfig, devices } from "@playwright/test";
import { headlessBrowserEnv } from "./scripts/browser-env.ts";

// 各テストは @desktop / @mobile / @nojs で対象面を宣言し、プロジェクト側が選択する。
// 本文で skip せず選択することで、対象外のブラウザコンテキストを開かずに済む。
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
  // 背景の WebGL は @webgl のテストだけが使うので、手元では並列を上げても CPU を奪い合わない。
  workers: Deno.env.get("CI") ? 2 : 4,
  reporter: Deno.env.get("CI") ? [["html", { open: "never" }], ["github"]] : "list",
  use: {
    baseURL: Deno.env.get("E2E_BASE_URL") ?? "http://127.0.0.1:4173",
    launchOptions: { env: headlessBrowserEnv() },
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: Deno.env.get("E2E_BASE_URL") ? undefined : {
    command: Deno.env.get("E2E_PREVIEW")
      ? "deno task preview --host 127.0.0.1 --port 4173"
      : "deno task dev --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173/api/v1/health",
    reuseExistingServer: !Deno.env.get("CI") && !Deno.env.get("E2E_PREVIEW"),
    // フォントと画像の生成が Vite より先に走るため、CI では2分を超えることがある。
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
