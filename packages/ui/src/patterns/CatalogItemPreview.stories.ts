import type { Meta, StoryObj } from "@storybook/svelte-vite";
import CatalogItemPreview from "./CatalogItemPreview.svelte";

const meta = {
  title: "Patterns/Catalog items",
  component: CatalogItemPreview,
  parameters: { layout: "padded" },
} satisfies Meta<typeof CatalogItemPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ArticleGrid: Story = { args: { kind: "article", view: "grid", image: true } };
export const ArticleListWithoutImage: Story = {
  args: { kind: "article", view: "list", image: false },
};
export const WorkGrid: Story = { args: { kind: "work", view: "grid", image: true } };
export const WorkListPlaceholder: Story = { args: { kind: "work", view: "list", image: false } };
