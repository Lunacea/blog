import adapter from "@deno/svelte-adapter";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { createEditorialPreprocessor } from "./mdsvex.config.js";

const config = {
  extensions: [".svelte", ".svx"],
  preprocess: [
    vitePreprocess(),
    createEditorialPreprocessor(),
  ],
  kit: {
    adapter: adapter(),
    alias: {
      "$content": "../../packages/content",
      "$core": "../../packages/core",
      "@lunacea/api": "../../packages/api/mod.ts",
      "@lunacea/config": "../../packages/config/mod.ts",
      "@lunacea/content": "../../packages/content/mod.ts",
      "@lunacea/content/*": "../../packages/content/*",
      "@lunacea/core/*": "../../packages/core/*",
      "@lunacea/schemas": "../../packages/schemas/mod.ts",
      "@lunacea/ui/fonts": "../../packages/ui/src/fonts.ts",
      "@lunacea/ui/icons": "../../packages/ui/src/icons/index.ts",
      "@lunacea/ui/primitives": "../../packages/ui/src/primitives/index.ts",
      "@lunacea/ui/styles.css": "../../packages/ui/src/styles/index.css",
      "@lunacea/ui/utils": "../../packages/ui/src/utils.ts",
    },
  },
};

export default config;
