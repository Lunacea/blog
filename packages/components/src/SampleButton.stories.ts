import type { Meta, StoryObj } from "@storybook/svelte-vite";
import SampleButton from "./SampleButton.svelte";

const meta = {
  title: "Components/SampleButton",
  component: SampleButton,
  argTypes: {
    type: {
      control: { type: "select" },
      options: ["primary", "secondary"],
    },
  },
} satisfies Meta<typeof SampleButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    text: "プライマリボタン",
    type: "primary",
  },
};

export const Secondary: Story = {
  args: {
    text: "セカンダリボタン",
    type: "secondary",
  },
};
