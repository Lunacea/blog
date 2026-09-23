import type { Meta, StoryObj } from "@storybook/sveltekit";
import { Badge } from "@lunacea/ui/primitives";

const meta = {
  title: "UI/Primitives/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { variant: "outline" },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Outline: Story = {};
export const Accent: Story = { args: { variant: "accent" } };
export const Negative: Story = { args: { variant: "negative" } };
