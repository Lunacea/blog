import type { StorybookConfig } from "@storybook/sveltekit";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../stories/**/*.stories.@(ts|svelte)"],
  staticDirs: ["../static"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/sveltekit",
    options: { docgen: false },
  },
  docs: { autodocs: "tag" },
  viteFinal: (config) =>
    mergeConfig(config, {
      resolve: {
        alias: {
          "$lib": fileURLToPath(new URL("../src/lib", import.meta.url)),
          "@lunacea/config": fileURLToPath(
            new URL("../../../packages/config/mod.ts", import.meta.url),
          ),
          "@lunacea/schemas": fileURLToPath(
            new URL("../../../packages/schemas/mod.ts", import.meta.url),
          ),
          "@lunacea/ui/fonts": fileURLToPath(
            new URL("../../../packages/ui/src/fonts.ts", import.meta.url),
          ),
          "@lunacea/ui/icons": fileURLToPath(
            new URL("../../../packages/ui/src/icons/index.ts", import.meta.url),
          ),
          "@lunacea/ui/primitives": fileURLToPath(
            new URL("../../../packages/ui/src/primitives/index.ts", import.meta.url),
          ),
          "@lunacea/ui/utils": fileURLToPath(
            new URL("../../../packages/ui/src/utils.ts", import.meta.url),
          ),
        },
      },
      build: {
        // Storybook のプレビューには Web に載らない axe などが含まれる。
        chunkSizeWarningLimit: 1000,
      },
    }),
};

export default config;
