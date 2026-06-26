import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  framework: "@storybook/svelte-vite",
  stories: [
    "../src/**/*.mdx",
    "../src/**/*.stories.@(js|jsx|mjs|ts|tsx|svelte)",
    "../../components/src/**/*.mdx",
    "../../components/src/**/*.stories.@(js|jsx|mjs|ts|tsx|svelte)",
  ],
  addons: [
    "@storybook/addon-a11y",
  ],
};

export default config;
