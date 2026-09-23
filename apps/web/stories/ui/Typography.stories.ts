import type { Meta, StoryObj } from "@storybook/sveltekit";
import TypographyPreview from "./TypographyPreview.svelte";

const meta = {
  title: "UI/Foundations/Typography",
  component: TypographyPreview,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TypographyPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedJapaneseAndLatin: Story = {};

export const Dark: Story = {
  globals: { theme: "dark" },
};
