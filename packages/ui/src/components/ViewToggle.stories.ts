import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ViewToggle from "./ViewToggle.svelte";

const meta = {
  title: "Components/ViewToggle",
  component: ViewToggle,
  args: { value: "grid", gridHref: "?view=grid", listHref: "?view=list" },
} satisfies Meta<typeof ViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Grid: Story = {};
export const List: Story = { args: { value: "list" } };
