import type { Meta, StoryObj } from "@storybook/sveltekit";
import { Input } from "@lunacea/ui/primitives";

const meta = {
  title: "UI/Primitives/Input",
  component: Input,
  tags: ["autodocs"],
  args: { placeholder: "キーワードで記事を探す" },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Filled: Story = { args: { value: "インターフェース" } };
/** The oversized editorial field: no box, one rule under the line. */
export const Query: Story = { args: { variant: "query" } };
export const Disabled: Story = { args: { disabled: true, value: "検索できません" } };
