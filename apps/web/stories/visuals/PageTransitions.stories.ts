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
/** モーションを止めるとビュー遷移を開始せずに遷移する。 */
export const Off: Story = { globals: { motion: "off" } };
