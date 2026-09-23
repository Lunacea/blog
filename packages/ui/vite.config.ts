import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
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
        await execFileAsync("deno", ["task", "fonts:generate"], { cwd: workspace });
        context.server.ws.send({ type: "full-reload" });
        return [];
      },
    },
    tailwindcss(),
    svelte(),
  ],
  resolve: {
    alias: {
      "@lunacea/schemas": fileURLToPath(new URL("../schemas/mod.ts", import.meta.url)),
    },
  },
});
