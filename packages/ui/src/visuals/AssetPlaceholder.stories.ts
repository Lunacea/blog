import type { Meta, StoryObj } from "@storybook/svelte-vite";
import AssetPlaceholderPreview from "./AssetPlaceholderPreview.svelte";

const meta = {
  title: "Visuals/AssetPlaceholder",
  component: AssetPlaceholderPreview,
  args: {
    assetId: "ASSET-001",
    role: "プロフィール画像",
    aspectRatio: "4 / 5",
    preferredFileType: "AVIF/WebP",
    accessibilityDescription: "人物と撮影状況を簡潔に説明する",
    transparencyRequired: false,
  },
} satisfies Meta<typeof AssetPlaceholderPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ProfileCharacter: Story = {
  args: {
    assetId: "profile-creature-crescent-v1",
    role: "三日月状の構図を持つプロフィールキャラクター",
    aspectRatio: "1 / 1",
    preferredFileType: "AVIF/WebP",
    accessibilityDescription: "黄色いウーパールーパーと魚の中間のキャラクターを説明する",
    transparencyRequired: true,
  },
};

export const TransparentIdentity: Story = {
  args: {
    assetId: "ASSET-002",
    role: "サイト識別子",
    aspectRatio: "1 / 1",
    preferredFileType: "SVG/PNG",
    accessibilityDescription: "装飾なら空のaltを維持する",
    transparencyRequired: true,
  },
};
