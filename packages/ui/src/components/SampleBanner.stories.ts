import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SampleBanner from "./SampleBanner.svelte";

const meta = {
  title: "Components/SampleBanner",
  component: SampleBanner,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SampleBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NarrowMobile: Story = {
  globals: { viewport: { value: "narrowMobile", isRotated: false } },
};
