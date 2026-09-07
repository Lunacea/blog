import type { Meta, StoryObj } from "@storybook/svelte-vite";
import IconGallery from "./IconGallery.svelte";

const meta = {
  title: "Foundations/Icons",
  component: IconGallery,
  tags: ["autodocs"],
} satisfies Meta<typeof IconGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SemanticSet: Story = {};
