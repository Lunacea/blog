import type { Meta, StoryObj } from "@storybook/svelte-vite";
import LinkSelector from "./LinkSelector.svelte";
import { interfaceIcons } from "../icons/semantic.ts";

const meta = {
  title: "Components/LinkSelector",
  component: LinkSelector,
  args: {
    label: "Category",
    options: [
      { label: "Engineering", href: "?category=engineering", active: true, count: 8 },
      { label: "Research", href: "?category=research", active: false, count: 3 },
      { label: "Design", href: "?category=design", active: false, count: 5 },
      { label: "Talk", href: "?category=talk", active: false, count: 2 },
    ],
  },
} satisfies Meta<typeof LinkSelector>;

export default meta;
type Story = StoryObj<typeof meta>;
export const Text: Story = {};
export const Icons: Story = {
  args: {
    label: "表示形式",
    display: "icon",
    options: [
      {
        label: "グリッド表示",
        title: "Grid",
        href: "?view=grid",
        active: true,
        icon: interfaceIcons.grid,
      },
      {
        label: "リスト表示",
        title: "List",
        href: "?view=list",
        active: false,
        icon: interfaceIcons.list,
      },
    ],
  },
};
