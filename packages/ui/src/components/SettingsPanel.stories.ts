import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SettingsPanel from "./SettingsPanel.svelte";

const meta = {
  title: "Components/SettingsPanel",
  component: SettingsPanel,
  tags: ["autodocs"],
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DarkReduced: Story = {
  globals: { theme: "dark", motion: "reduced" },
};
