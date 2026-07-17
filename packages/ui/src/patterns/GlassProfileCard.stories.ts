import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { visualAssets } from "@lunacea/config";
import GlassProfileCard from "./GlassProfileCard.svelte";

const meta = {
  title: "Patterns/GlassProfileCard",
  component: GlassProfileCard,
  parameters: { layout: "padded" },
  args: {
    asset: visualAssets.profile,
    name: "Lunacea",
    field: "Interactive Systems / Design Research",
    github: "https://github.com/example",
    x: "https://x.com/example",
    email: "mailto:hello@example.com",
  },
} satisfies Meta<typeof GlassProfileCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {};
export const DarkReduced: Story = { globals: { theme: "dark", motion: "reduced" } };
export const LongField: Story = {
  args: {
    field: "Interactive Systems, Spatial Interfaces, and Long-lived Editorial Software",
  },
};
export const MissingContact: Story = {
  args: {
    github: null,
    x: null,
    email: null,
  },
};
