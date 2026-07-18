# Catalog・Article・Header UI Refinement ExecPlan

Status: Complete

## Goal and non-goals

Home以外の初期表示で固定Headerと本文が重ならないようにし、Theme/Display操作、常時表示の catalog
filter、Article詳細、Grid/List配置遷移を一貫した矩形ベースのUIへ更新する。公開query、 content
schema、reaction API、prerender/SSR境界、依存packageは変更しない。

## Decisions and constraints

- Title Theme glyphは全interaction stateでaccent色を維持し、Header Theme
  toggleは常に透明背景とする。
- Displayは単一buttonを維持し、Off=直線、Reduced=波線1本、Full=波線2本のlocal SVGで表す。
- Catalog filterはnative GET formとlinkを維持し、JavaScriptなしでもArticles検索とview変更を使える。
- View transitionは同一pathnameで`view`だけが変わるnavigationに限定し、Reduced/Offでは使わない。
- Article専用headerだけを一覧のserif typographyへ寄せ、Work詳細のimage-first構成は維持する。
- Cleanupは今回変更するHeader、catalog、article、motion領域に限定し、既存のTalk削除やasset変更を
  変更しない。

## Milestones

- [x] Theme/Display glyphとnon-Home header clearance
- [x] 常時表示の共有Catalog Controlsとcompact FilterSelector
- [x] Article header、本文heading、tag/status、Related、Reaction
- [x] Grid/List item view transitionとReduced/Off fallback
- [x] 変更領域の重複・未使用code整理
- [x] Design/architecture文書同期
- [x] Unit、check、targeted E2E、format、lint、design、build、budget

## Validation

- `deno task --cwd apps/web check`: pass、Svelte diagnostics 0件。
- `deno task test:unit`: pass、3 files / 11 tests。
- `deno task design:check`: pass。
- `deno task lint`: pass、125 files。
- `deno task fmt:check`: 初回は変更した3 filesのformat差分でfail。`deno fmt`後の再実行はpass、 154
  files。
- 対象Playwright E2E: 初回はtheme toggleの動的accessible nameとrelated件数の固定期待値により
  2件fail。assertion修正後の対象再実行を含め、Desktop/Mobile header intersection、200% text、 no-JS
  search、Full/Off view transition、Article detailがpass。
- `deno task build`: 初回は既存social handleが内部pathとしてprerenderされ404でfail。値を同一
  accountの完全な外部URLへ正規化後にpass。
- `deno task budget:check`: pass。Article initial JavaScript 91.4 KiB gzip、Home WebGL JavaScript
  225.1 KiB gzip。
- `git diff --check`: pass。
- Browser実測でArticles、Works、Archive、Article detailのDesktop/Mobile header交差面積0、 catalog
  disclosure不在、reading surface透明、title glyphのaccent維持、dark theme背景透明、 Fullの2-wave
  glyph、Fullでtransition 1回・Offでtransitionなしを確認した。

## Progress and discoveries

- 開始時点のworktreeには前回のUI/WebGL変更、Talk route削除、configと画像asset変更があり、すべて
  user-ownedとして保持する。
- 現状の実測ではDesktopのcatalog controlsとArticle詳細title、Mobileのcatalog titleがHeaderの control
  regionと交差する。
- Title glyphは通常時accent色だが、hover selectorがprimary色へ上書きする。Dark Header Theme
  toggleは`aria-pressed=true`でforeground背景が付く。
- Catalog 3 routeは同じdisclosure/search CSSを重複しているため、Web内部componentへ統合できる。
- Articlesのnative GET searchと各routeのquery/history behaviorを共有componentのslotで維持した。
- catalog transitionは同一pathnameかつ`view` queryだけが変化するnavigationに限定し、root fadeを
  無効化してstable item名だけを補間する。
- 既存configのSNS値は`@handle`のままだとSvelteKitが内部linkとしてprerenderするため、accountを
  変えず`https://github.com/Lunacea`と`https://x.com/_Lunacea`へ正規化した。
- Buildの500 KiB超chunk warningはHomeの既存WebGL dependency graphに由来する。Article budgetは
  acceptance limit内で、今回のArticle/Catalog変更に追加dependencyはない。
