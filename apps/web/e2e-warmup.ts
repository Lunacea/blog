import type { FullConfig } from "@playwright/test";

const warmupRoutes = [
  "/",
  "/articles",
  "/works",
  "/archive",
  "/articles/resilient-content-pipeline",
] as const;

export default async function warmup(config: FullConfig): Promise<void> {
  const configuredBase = config.projects[0]?.use.baseURL;
  const baseURL = typeof configuredBase === "string" ? configuredBase : "http://127.0.0.1:4173";

  for (const route of warmupRoutes) {
    const response = await fetch(new URL(route, baseURL));
    if (!response.ok) throw new Error(`E2E warm-up failed for ${route}: ${response.status}`);
    await response.arrayBuffer();
  }
}
