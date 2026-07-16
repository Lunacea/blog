import type { Meta, StoryObj } from "@storybook/svelte-vite";
import StatusBadge from "./StatusBadge.svelte";

const meta = {
  title: "Components/StatusBadge",
  component: StatusBadge,
  tags: ["autodocs"],
} satisfies Meta<typeof StatusBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stable: Story = { args: { status: "stable" } };
export const Growing: Story = { args: { status: "growing" } };
export const Fragment: Story = { args: { status: "fragment" } };
export const Deprecated: Story = { args: { status: "deprecated" } };
