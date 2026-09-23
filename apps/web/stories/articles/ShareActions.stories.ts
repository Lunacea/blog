import type { Meta, StoryObj } from "@storybook/sveltekit";
import ShareActions from "$lib/articles/ShareActions.svelte";

const meta = {
  title: "Articles/ShareActions",
  component: ShareActions,
  tags: ["autodocs"],
  args: {
    title: "ボタンの触り心地を決める4つの状態",
    url: "https://blog.lunacea.jp/articles/button-feel",
    via: "lunacea",
    hashtags: ["Design", "Interface"],
  },
} satisfies Meta<typeof ShareActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inline: Story = {};
/**
 * When the side rail is narrower than 96px the labels go to screen readers only.
 * Narrow the preview to see the icons alone.
 */
export const Rail: Story = { args: { variant: "rail" } };
