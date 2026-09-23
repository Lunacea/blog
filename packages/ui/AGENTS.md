# UIパッケージ

ルートの指示を継承する。`packages/ui`はサイトから独立して再利用できるデザインシステム基盤に
限定する。現行契約は`docs/design-system.md`を参照する。

## 所有範囲

- `src/styles`：共通token、base CSS、少数の共通utility。公開入口は`styles/index.css`。
- `src/primitives`：Badge、Input、Separator、Collapsibleと利用中のvariant。
- `src/icons`：Iconifyの固定集合とローカルglyph。
- `src/fonts.ts`：初期表示でpreloadする生成font URL。
- `src/utils.ts`：UIで共用する小さな純粋utility。
- 公開subpathは`primitives`、`icons`、`utils`、`fonts`、`styles.css`だけにする。任意の深い
  importやroot barrelを追加しない。
- 記事、Home、shell、表示設定、遷移、WebGL、Story、SVX設定は`apps/web`が所有する。
- `$app`、site config、content schema、network、Three.js、mdsvex、KaTeX、Mermaidへ依存しない。

## 実装

- 通常のスタイルは静的なTailwind classで表し、Svelteへ`<style>`を追加しない。
- 共通scaleだけを`styles/tokens.css`へ置く。Home、記事、footer、天候などサイト固有のtokenは
  `apps/web/src/styles/tokens.css`へ置く。
- CSSに残すselectorはreset、forced colors、print、共通utilityなど、markupのclassだけでは
  表現しにくいものに限る。
- 既存primitive、Bits UIの順に再利用する。フォーカス管理やARIAを見た目のために独自実装しない。
- Iconifyは`Icon.svelte`を通す。一般UIはSolar、公式brandはSimple Iconsを使う。
- 操作子にはaccessible nameを付け、文字拡大、forced colors、reduced motionを維持する。

## 確認

変更したprimitive、icon、CSSの代表的なWeb利用箇所を確認する。共通UIのstoryは
`apps/web/stories/ui`、Storybook設定と検査は`apps/web/.storybook`と`apps/web/scripts`に置く。
記法だけなら生成CSSと型、操作変更なら関連unit/E2E、描画負荷の変更なら停止とcleanupを優先する。
