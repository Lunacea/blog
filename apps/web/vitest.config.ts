import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [svelte(), svelteTesting({ autoCleanup: false })],
  resolve: {
    alias: {
      "$app/environment": fileURLToPath(
        new URL("./tests/mocks/app-environment.ts", import.meta.url),
      ),
      "$app/state": fileURLToPath(new URL("./tests/mocks/app-state.ts", import.meta.url)),
      "$lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "$routes": fileURLToPath(new URL("./src/routes", import.meta.url)),
      "@lunacea/ui/fonts": fileURLToPath(
        new URL("../../packages/ui/src/fonts.ts", import.meta.url),
      ),
      "@lunacea/ui/icons": fileURLToPath(
        new URL("../../packages/ui/src/icons/index.ts", import.meta.url),
      ),
      "@lunacea/ui/primitives": fileURLToPath(
        new URL("../../packages/ui/src/primitives/index.ts", import.meta.url),
      ),
      "@lunacea/ui/utils": fileURLToPath(
        new URL("../../packages/ui/src/utils.ts", import.meta.url),
      ),
      "@lunacea/config": fileURLToPath(new URL("../../packages/config/mod.ts", import.meta.url)),
      "@lunacea/schemas": fileURLToPath(new URL("../../packages/schemas/mod.ts", import.meta.url)),
    },
  },
  ssr: {
    noExternal: [
      "bits-ui",
      "runed",
      "svelte-toolbelt",
      /bits-ui|runed|svelte-toolbelt|@iconify/,
    ],
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./tests/setup.ts"],
  },
});
