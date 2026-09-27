# コンテンツ執筆ガイド

## 配置とID

各資料は`packages/content/entries`以下の`index.svx`です。slugとディレクトリ名は一致させます。

```text
articles/<slug>/index.svx
works/<slug>/index.svx
archive/photos/<slug>/index.svx
archive/places/<slug>/index.svx
archive/wines/<slug>/index.svx
archive/moments/<slug>/index.svx
```

Talkは`category: talk`を持つArticleとして`articles/`へ配置し、独立した`talks/` routeは作成しません。

安定IDは`<type>:<slug>`です。`related`にはこのIDを指定します。

## 共通frontmatter

```yaml
---
slug: example-record
type: article
title: 表示タイトル
summary: 一覧、検索、OGPで使う24〜240文字の概要
publishedAt: 2026-07-14
updatedAt: 2026-07-14
tags: [SvelteKit, Deno]
status: growing
featured: false
draft: false
sample: false
cover:
  src: /images/articles/example.webp
  alt: 画像が伝える内容
  width: 1600
  height: 1067
related: [work:example]
revisions:
  - date: 2026-07-14
    summary: 初版を公開
---
```

`status`は`stable | growing | fragment | deprecated`です。coverは自分で所有するAVIF/WebPだけを`apps/web/static/images`へ置き、寸法と意味のあるaltを必ず書きます。外部画像hotlinkはvalidatorが拒否します。

種別固有フィールドは[packages/schemas/src/content.ts](/app/packages/schemas/src/content.ts)が唯一の仕様です。Articleは`category`と`targetVersions`、Workは`period`・`role`・`stack`・`links`、Talkは`event`・`venue`・`format`・`links`、Wineは`producer`・`region`などを要求します。

## 本文機能

- `##`と`###`から見出しリンクと目次を生成する。
- fenced codeに`title="file.ts" {2,5}`を付けるとファイル名と行強調を表示する。
- `mermaid` fenceはブラウザで必要時だけ描画する。`title="公開フロー"`を付けると、
  figureの表示captionとaccessible nameにも使われる。
- `$...$`と`$$...$$`はbuild時にKaTeX HTMLへ変換する。数式表示にclient-side JavaScriptは不要。
- blockquote、表、リスト、引用、`<aside class="annotation">`を利用できる。
- 段落内の改行は、前後どちらかが和文の字なら描画時に取り除かれ、空白にならない。
  欧文どうしの改行は空白として残る。改行を見せたいときは行末に空白2つを置く。
- コールアウトは`$lib/articles/Callout.svelte`から`Callout`をimportし、
  `<Callout kind="column" title="見出し">`と書く。`kind`は`column | note | tip | warning`
  （既定は`note`）で、種類ごとの図像と語が付く。本文をMarkdownで書くときは、開始・終了タグとの間に
  空行を置く。
- 参考文献は`$lib/articles/References.svelte`の`References`を記事の末尾に置き、
  `<References items={references} />`と書く。`references`は`<script>`に引用順の配列で定義する
  （`author`、`title`、`site`、`url`、`accessed`、日本語の資料は`lang: "ja"`）。書式は情報処理学会の
  Webページの形式で、既定では折り畳まれる。本文の該当箇所には`$lib/articles/Cite.svelte`の
  `<Cite n={1} />`を置き、右肩に`[1]`を付ける。番号から飛ぶと折り畳みが開く。
- 外部リンクカードは`$lib/articles/LinkCard.svelte`から`LinkCard`をimportし、
  `<LinkCard href="https://example.com/article" />`と書く。追加・変更後に
  `deno task links:refresh`を明示実行し、更新された
  `packages/content/link-previews.json`と`apps/web/static/images/ogp/external/`を確認する。
  通常のvalidation/buildは外部通信せず、cacheがないURLはvalidation errorになる。

全機能の実例は[showcase記事](/app/packages/content/entries/articles/resilient-content-pipeline/index.svx)にあります。

## 公開前

```bash
deno task content:validate
deno task check
deno task test
deno task build
deno task budget:check
```

`draft: true`はregistryから除外します。`sample: true`は通常ページには表示されますがRSS、Atom、Sitemapから除外されます。
