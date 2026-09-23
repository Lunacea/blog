import type { Meta, StoryObj } from "@storybook/sveltekit";
import SettingsPanel from "$lib/preferences/SettingsPanel.svelte";

const meta = {
  title: "Shell/SettingsPanel",
  component: SettingsPanel,
  tags: ["autodocs"],
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkReduced: Story = {
  globals: { theme: "dark", motion: "reduced" },
};
