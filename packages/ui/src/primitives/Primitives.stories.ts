import type { Meta, StoryObj } from "@storybook/svelte-vite";
import PrimitivesPreview from "./PrimitivesPreview.svelte";

const meta = {
  title: "Primitives/Overview",
  component: PrimitivesPreview,
} satisfies Meta<typeof PrimitivesPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InteractiveStates: Story = {};
