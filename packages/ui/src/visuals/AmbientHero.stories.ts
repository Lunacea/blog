import type { Meta, StoryObj } from "@storybook/svelte-vite";
import AmbientHeroPreview from "./AmbientHeroPreview.svelte";

const meta = {
  title: "Visuals/AmbientHero",
  component: AmbientHeroPreview,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof AmbientHeroPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StaticFallback: Story = {
  globals: { motion: "reduced" },
};

export const EnhancedWhenCapable: Story = {
  globals: { motion: "full" },
};
