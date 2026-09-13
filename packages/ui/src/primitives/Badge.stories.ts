import type { Meta, StoryObj } from "@storybook/svelte-vite";
import Badge from "./Badge.svelte";

const meta = {
  title: "Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { variant: "outline" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Accent: Story = { args: { variant: "accent" } };
export const Negative: Story = { args: { variant: "negative" } };
