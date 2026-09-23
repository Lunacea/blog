import type { Meta, StoryObj } from "@storybook/sveltekit";
import WeatherLightPreview from "./WeatherLightPreview.svelte";

const meta = {
  title: "Visuals/Weather light",
  component: WeatherLightPreview,
  parameters: { layout: "fullscreen" },
  args: { condition: "neutral", intensity: "steady" },
  globals: { motion: "full" },
} satisfies Meta<typeof WeatherLightPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Clear: Story = { args: { condition: "clear" } };
export const Cloudy: Story = { args: { condition: "cloudy" } };
export const Rain: Story = { args: { condition: "rain" } };
export const Snow: Story = { args: { condition: "snow" } };
/** A reading that never arrived: the field stays neutral and the page still reads. */
export const Neutral: Story = {};
/** A shower only passing through is drawn part of the way from the cloud it crossed. */
export const PassingRain: Story = { args: { condition: "rain", intensity: "passing" } };
export const PassingSnow: Story = { args: { condition: "snow", intensity: "passing" } };
/** モーションを切ると場はグレインだけになり、WebGLの文脈は作られない。 */
export const MotionOff: Story = { args: { condition: "rain" }, globals: { motion: "off" } };
