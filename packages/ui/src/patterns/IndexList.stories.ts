import type { Meta, StoryObj } from "@storybook/svelte-vite";
import IndexListPreview from "./IndexListPreview.svelte";
import type { IndexEntry } from "./index-entry.ts";

const entries: IndexEntry[] = [
  {
    slug: "motion-that-asks-first",
    href: "/articles/motion-that-asks-first",
    title: "動きは設定を先に聞く",
    summary:
      "prefers-reduced-motionを後から足すのは大変でした。動きを情報として使いつつ、止めても壊れない作り方を書いています。",
    category: "Design",
    publishedAt: "2026-09-04",
    tags: ["Motion", "Accessibility", "Interface"],
  },
  {
    slug: "color-tokens-first",
    href: "/articles/color-tokens-first",
    title: "色を直接書かずに名前で持つ",
    summary:
      "ダークテーマに対応しようとして色を書き直した経験から、最初から意味のある名前で色を持っておく利点をまとめました。",
    category: "Design",
    publishedAt: "2026-08-28",
    tags: ["Design", "Interface", "Tailwind CSS"],
  },
  {
    slug: "resilient-content-pipeline",
    href: "/articles/resilient-content-pipeline",
    title: "壊れにくいコンテンツパイプラインを設計する",
    summary: "Gitを正本にした記事を、検証可能な型と静的生成へ接続するための設計判断をまとめる。",
    category: "Engineering",
    publishedAt: "2026-06-18",
    tags: ["SvelteKit", "Deno", "Content"],
  },
];

const meta = {
  title: "Patterns/IndexList",
  component: IndexListPreview,
  parameters: { layout: "fullscreen" },
  args: { entries, label: "記事一覧" },
} satisfies Meta<typeof IndexListPreview>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The catalog: rules span the column and the glass fades out toward both outer edges. */
export const Compact: Story = { args: { bleed: "compact" } };
/** Home: rules run the full width of the window while the content stays on the page grid. */
export const Bleed: Story = { args: { bleed: true } };
export const Inline: Story = {};
export const WithoutSummaries: Story = {
  args: { entries: entries.map(({ summary: _summary, ...rest }) => rest) },
};
