import type { Meta, StoryObj } from "@storybook/svelte-vite";
import LinkCard from "./LinkCard.svelte";

const meta = {
  title: "Components/LinkCard",
  component: LinkCard,
  tags: ["autodocs"],
} satisfies Meta<typeof LinkCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ManualMetadata: Story = {
  args: {
    href: "https://docs.deno.com/deploy/reference/frameworks/",
    site: "docs.deno.com",
    title: "Frameworks — Deno Deploy",
    description: "外部取得に依存せず、執筆者が確認したタイトルと概要だけを表示します。",
  },
};
