import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ThemeToggle from "./ThemeToggle.svelte";

const meta = {
  title: "Components/ThemeToggle",
  component: ThemeToggle,
  tags: ["autodocs"],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = { globals: { theme: "light" } };
export const Dark: Story = { globals: { theme: "dark" } };
export const TitleMotif: Story = { args: { placement: "title" } };
