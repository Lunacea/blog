import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      "@lunacea/schemas": fileURLToPath(new URL("../schemas/mod.ts", import.meta.url)),
    },
  },
});
