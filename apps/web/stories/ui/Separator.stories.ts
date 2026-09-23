import type { Meta, StoryObj } from "@storybook/sveltekit";
import { Separator } from "@lunacea/ui/primitives";

const meta = {
  title: "UI/Primitives/Separator",
  component: Separator,
  tags: ["autodocs"],
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {};
export const Vertical: Story = { args: { orientation: "vertical", class: "h-16" } };
/** Not decorative when it separates two labelled regions rather than two paragraphs. */
export const Meaningful: Story = { args: { decorative: false } };
