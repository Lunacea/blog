import type { Meta, StoryObj } from "@storybook/svelte-vite";
import FoundationsPreview from "./FoundationsPreview.svelte";

const meta = {
  title: "Foundations/Tokens",
  component: FoundationsPreview,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FoundationsPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  globals: { theme: "light" },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};
