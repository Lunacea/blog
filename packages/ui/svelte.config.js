import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { createEditorialPreprocessor } from "./mdsvex.config.js";

export default {
  extensions: [".svelte", ".svx"],
  preprocess: [vitePreprocess(), createEditorialPreprocessor()],
};
