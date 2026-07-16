import type { Meta, StoryObj } from "@storybook/svelte-vite";
import MotionPreview from "./MotionPreview.svelte";

const meta = {
  title: "Motion/Page transitions",
  component: MotionPreview,
  tags: ["autodocs"],
  args: { mode: "page" },
} satisfies Meta<typeof MotionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = { globals: { motion: "full" } };
export const Reduced: Story = { globals: { motion: "reduced" } };
export const Off: Story = { globals: { motion: "off" } };
