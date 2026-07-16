import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()],
  ssr: {
    noExternal: [
      "bits-ui",
      "runed",
      "svelte-toolbelt",
      /bits-ui|runed|svelte-toolbelt|@iconify/,
    ],
  },
  server: {
    fs: {
      allow: ["../.."],
    },
  },
});
