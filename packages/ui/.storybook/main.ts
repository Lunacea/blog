import type { StorybookConfig } from "@storybook/svelte-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|svelte)"],
  addons: ["@storybook/addon-a11y"],
  framework: {
    name: "@storybook/svelte-vite",
    options: { docgen: false },
  },
  docs: { autodocs: "tag" },
};

export default config;
