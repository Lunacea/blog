import type { Meta, StoryObj } from "@storybook/svelte-vite";
import CatalogItemPreview from "./CatalogItemPreview.svelte";

const meta = {
  title: "Patterns/Catalog items",
  component: CatalogItemPreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CatalogItemPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArticleLead: Story = { args: { variant: "lead", image: true } };
export const ArticleColumn: Story = { args: { variant: "column", image: true } };
export const ArticleCompact: Story = { args: { variant: "compact", image: false } };
export const ArticleListWithoutImage: Story = {
  args: { variant: "list", image: false },
};
