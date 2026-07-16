import type { StorybookConfig } from "@storybook/svelte-vite";
import { fileURLToPath } from "node:url";
import { mergeConfig } from "vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|svelte)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/svelte-vite",
    options: { docgen: false },
  },
  docs: { autodocs: "tag" },
  viteFinal: (config) =>
    mergeConfig(config, {
      resolve: {
        alias: {
          "$app/navigation": fileURLToPath(
            new URL("./mocks/app-navigation.ts", import.meta.url),
          ),
          "@lunacea/config": fileURLToPath(new URL("../../config/mod.ts", import.meta.url)),
          "@lunacea/schemas": fileURLToPath(new URL("../../schemas/mod.ts", import.meta.url)),
        },
      },
      build: {
        // Storybook's isolated preview includes axe and manager tooling that never ships to Web.
        chunkSizeWarningLimit: 1000,
      },
    }),
};

export default config;
