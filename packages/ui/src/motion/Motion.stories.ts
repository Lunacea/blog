import type { Meta, StoryObj } from "@storybook/svelte-vite";
import MotionPreview from "./MotionPreview.svelte";

const meta = {
  title: "Motion/Liquid surfaces",
  component: MotionPreview,
  parameters: { layout: "fullscreen" },
  args: { text: "LUNACEA", slotIndex: 4 },
} satisfies Meta<typeof MotionPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = { globals: { motion: "full" } };
export const Reduced: Story = { globals: { motion: "reduced" } };
/** Motion off renders the same content flat; nothing is hidden behind an animation. */
export const Off: Story = { globals: { motion: "off" } };
