import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SiteFooter from "./SiteFooter.svelte";

const meta = {
  title: "Components/SiteFooter",
  component: SiteFooter,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SiteFooter>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Desktop: Story = {};

export const NarrowMobile: Story = {
  globals: { viewport: { value: "narrowMobile", isRotated: false } },
};
