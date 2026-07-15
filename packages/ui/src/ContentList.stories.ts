import type { Meta, StoryObj } from "@storybook/svelte-vite";
import ContentList from "./ContentList.svelte";

const meta = {
  title: "Content/ContentList",
  component: ContentList,
  tags: ["autodocs"],
} satisfies Meta<typeof ContentList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MixedRecords: Story = {
  args: {
    showType: true,
    entries: [
      {
        type: "article",
        slug: "quiet-interface",
        title: "静かなインターフェースを設計する",
        summary: "情報の階層を保ちながら、環境の気配を穏やかに重ねるための設計記録です。",
        tags: ["Svelte", "Design"],
        publishedAt: "2026-07-02",
        status: "stable",
      },
      {
        type: "work",
        slug: "field-note",
        title: "Field Note Index",
        summary: "研究と制作の途中経過を、完成度によらず検索できるようにする索引です。",
        tags: ["Archive", "Research"],
        publishedAt: "2026-05-18",
        status: "growing",
      },
    ],
  },
};
