import type { Meta, StoryObj } from "@storybook/sveltekit";
import PageTransitionsPreview from "./PageTransitionsPreview.svelte";

const meta = {
  title: "Visuals/Page transitions",
  component: PageTransitionsPreview,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof PageTransitionsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = { globals: { motion: "full" } };
/** モーション低減時はビュー遷移を開始せずに遷移する。 */
export const Reduced: Story = { globals: { motion: "reduced" } };
export const Off: Story = { globals: { motion: "off" } };
