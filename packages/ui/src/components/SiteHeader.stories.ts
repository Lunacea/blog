import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { primaryNavigation } from "@lunacea/config";
import SiteHeaderPreview from "./SiteHeaderPreview.svelte";

const meta = {
  title: "Components/SiteHeader",
  component: SiteHeaderPreview,
  parameters: { layout: "fullscreen" },
  args: {
    navigation: primaryNavigation,
    pathname: "/articles",
  },
} satisfies Meta<typeof SiteHeaderPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const Mobile: Story = {
  globals: { viewport: { value: "mobile", isRotated: false } },
};

export const ArticlesCurrent: Story = {
  args: { pathname: "/articles" },
};
