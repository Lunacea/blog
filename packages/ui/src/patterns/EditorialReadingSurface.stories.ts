import type { Meta, StoryObj } from "@storybook/svelte-vite";
import EditorialPreview from "./EditorialPreview.svelte";

const meta = {
  title: "Patterns/Editorial reading surface",
  component: EditorialPreview,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof EditorialPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const CompleteDocument: Story = {};

export const Dark: Story = {
  globals: { theme: "dark" },
};
