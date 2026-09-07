import { sveltekit } from "@sveltejs/kit/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { execFile } from "node:child_process";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const fontSources =
  /(?:packages\/content\/entries|packages\/ui\/src|apps\/web\/src|packages\/config).+\.(?:svx|svelte|ts)$/u;
const execFileAsync = promisify(execFile);
const workspace = fileURLToPath(new URL("../../", import.meta.url));

export default defineConfig({
  plugins: [
    {
      name: "lunacea-font-subsets",
      async handleHotUpdate(context) {
        if (!fontSources.test(context.file)) return;
        if (context.file.endsWith(".svx")) {
          await execFileAsync("deno", ["task", "content:generate"], { cwd: workspace });
        }
        await execFileAsync("deno", ["task", "fonts:generate"], { cwd: workspace });
        context.server.ws.send({ type: "full-reload" });
        return [];
      },
    },
    tailwindcss(),
    sveltekit(),
  ],
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
