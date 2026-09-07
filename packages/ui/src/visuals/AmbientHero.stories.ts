import type { Meta, StoryObj } from "@storybook/svelte-vite";
import AmbientHeroPreview from "./AmbientHeroPreview.svelte";

const meta = {
  title: "Visuals/AmbientHero",
  component: AmbientHeroPreview,
  parameters: { layout: "fullscreen" },
  args: { weather: "neutral" },
} satisfies Meta<typeof AmbientHeroPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const StaticFallback: Story = {
  globals: { motion: "reduced" },
};

export const MinimalWithoutCentralMotif: Story = {
  globals: { motion: "off" },
};

export const EnhancedWhenCapable: Story = {
  globals: { motion: "full" },
};

export const Clear: Story = { args: { weather: "clear" } };
export const Cloudy: Story = { args: { weather: "cloudy" } };
export const Rain: Story = { args: { weather: "rain" } };
export const Snow: Story = { args: { weather: "snow" } };
export const WeatherFallback: Story = { args: { weather: "neutral" } };
