import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SettingsPanel from "./SettingsPanel.svelte";

const meta = {
  title: "System/SettingsPanel",
  component: SettingsPanel,
  tags: ["autodocs"],
} satisfies Meta<typeof SettingsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
