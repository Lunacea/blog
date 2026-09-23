import type { Meta, StoryObj } from "@storybook/sveltekit";
import StatusBadge from "$lib/articles/StatusBadge.svelte";

const meta = {
  title: "Articles/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stable: Story = { args: { status: "stable" } };
export const Growing: Story = { args: { status: "growing" } };
export const Fragment: Story = { args: { status: "fragment" } };
export const Deprecated: Story = { args: { status: "deprecated" } };
