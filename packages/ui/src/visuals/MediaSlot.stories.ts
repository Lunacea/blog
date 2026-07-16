import type { Meta, StoryObj } from "@storybook/svelte-vite";
import { visualAssets } from "@lunacea/config";
import MediaSlot from "./MediaSlot.svelte";

const meta = {
  title: "Visuals/MediaSlot",
  component: MediaSlot,
  args: {
    showPlaceholder: true,
    label: "Storybook preview",
  },
} satisfies Meta<typeof MediaSlot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfilePlaceholder: Story = {
  args: { asset: visualAssets.profile },
};

export const OrganicPlaceholder: Story = {
  args: { asset: visualAssets.heroOrganic },
};
