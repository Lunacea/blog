import type { Meta, StoryObj } from "@storybook/svelte-vite";
import IconGallery from "./IconGallery.svelte";

const meta = {
  title: "Icons/Gallery",
  component: IconGallery,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const All: Story = {};
/** ブランドマークを持つタグと、汎用グリフに落ちるタグの対比。 */
export const TagFallback: Story = {
  args: { tags: ["Svelte", "Deno", "WebGL", "Motion", "Essay", "Archive"] },
};
