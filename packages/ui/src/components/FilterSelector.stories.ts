import type { Meta, StoryObj } from "@storybook/svelte-vite";
import FilterSelector from "./FilterSelector.svelte";

const meta = {
  title: "Components/FilterSelector",
  component: FilterSelector,
  args: {
    label: "Category",
    options: [
      { label: "Engineering", href: "?category=engineering", active: true },
      { label: "Research", href: "?category=research", active: false },
      { label: "Design", href: "?category=design", active: false },
      { label: "Talk", href: "?category=talk", active: false },
    ],
  },
} satisfies Meta<typeof FilterSelector>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const LongLabels: Story = {
  args: {
    label: "Technology",
    options: [
      { label: "Information Architecture", href: "#", active: false },
      { label: "Accessible Information Design", href: "#", active: true },
      { label: "Human–Computer Interaction", href: "#", active: false },
    ],
  },
};
