import { svelte } from "@sveltejs/vite-plugin-svelte";
import { svelteTesting } from "@testing-library/svelte/vite";
import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [svelte(), svelteTesting({ autoCleanup: false })],
  resolve: {
    alias: {
      "$lib": fileURLToPath(new URL("./src/lib", import.meta.url)),
      "$routes": fileURLToPath(new URL("./src/routes", import.meta.url)),
      "$ui": fileURLToPath(new URL("../../packages/ui/src", import.meta.url)),
      "@lunacea/config": fileURLToPath(new URL("../../packages/config/mod.ts", import.meta.url)),
      "@lunacea/schemas": fileURLToPath(new URL("../../packages/schemas/mod.ts", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
  },
});
