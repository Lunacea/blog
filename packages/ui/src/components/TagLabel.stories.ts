import type { Meta, StoryObj } from "@storybook/svelte-vite";
import TagLabel from "./TagLabel.svelte";

const meta = {
  title: "Components/TagLabel",
  component: TagLabel,
  tags: ["autodocs"],
  args: { tag: "SvelteKit" },
} satisfies Meta<typeof TagLabel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Technology: Story = {};
export const VersionedTechnology: Story = { args: { tag: "Deno 2" } };
export const EditorialFallback: Story = { args: { tag: "Research" } };
export const Linked: Story = { args: { tag: "WebGL", href: "/tags/WebGL" } };
