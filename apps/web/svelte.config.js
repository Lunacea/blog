import adapter from "@deno/svelte-adapter";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { createEditorialPreprocessor } from "../../packages/ui/mdsvex.config.js";

const config = {
  extensions: [".svelte", ".svx"],
  preprocess: [
    vitePreprocess(),
    createEditorialPreprocessor(),
  ],
  kit: {
    adapter: adapter(),
    alias: {
      "$ui": "../../packages/ui/src",
      "$content": "../../packages/content",
      "$core": "../../packages/core",
      "@lunacea/api": "../../packages/api/mod.ts",
      "@lunacea/config": "../../packages/config/mod.ts",
      "@lunacea/content": "../../packages/content/mod.ts",
      "@lunacea/content/*": "../../packages/content/*",
      "@lunacea/core/*": "../../packages/core/*",
      "@lunacea/schemas": "../../packages/schemas/mod.ts",
      "@lunacea/ui/*": "../../packages/ui/src/*",
    },
  },
};

export default config;
