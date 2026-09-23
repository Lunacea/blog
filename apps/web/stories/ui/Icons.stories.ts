import type { Meta, StoryObj } from "@storybook/sveltekit";
import IconGallery from "./IconGallery.svelte";

const meta = {
  title: "UI/Icons/Gallery",
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
