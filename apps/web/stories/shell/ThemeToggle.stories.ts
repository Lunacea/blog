import type { Meta, StoryObj } from "@storybook/sveltekit";
import ThemeToggle from "$lib/preferences/ThemeToggle.svelte";

const meta = {
  title: "Shell/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = { globals: { theme: "light" } };
export const Dark: Story = { globals: { theme: "dark" } };
export const TitleMotif: Story = { args: { placement: "title" } };
