import type { Meta, StoryObj } from "@storybook/sveltekit";
import CategoryLabel from "$lib/articles/CategoryLabel.svelte";

const meta = {
  title: "Articles/CategoryLabel",
  component: CategoryLabel,
  tags: ["autodocs"],
  args: { category: "Design" },
} satisfies Meta<typeof CategoryLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain text where the category is not a destination. */
export const Static: Story = {};
/** A link carries a rule that comes up to ink on hover and focus. */
export const Linked: Story = { args: { href: "/articles?category=Design" } };
export const LongName: Story = { args: { category: "Engineering", href: "/articles" } };
