import type { Meta, StoryObj } from "@storybook/svelte-vite";
import LayoutPreview from "./LayoutPreview.svelte";

const meta = {
  title: "Layout/Primitives",
  component: LayoutPreview,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof LayoutPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Composition: Story = {};

export const Narrow: Story = {
  globals: { viewport: { value: "narrowMobile", isRotated: false } },
};
