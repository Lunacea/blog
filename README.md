# Lunacea Archive

ブログ、作品、登壇、写真・場所・ワイン・Momentを一つの情報設計で扱う、Lunacea名義の個人アーカイブです。SvelteKitを唯一のデプロイ単位にし、Hono
APIを同じアプリの`/api/v1`へ組み込んでいます。

現在同梱している18件は交換用サンプルです。`sampleMode`が有効な間は全ページにバナーと`noindex`を出し、RSS・Atom・Sitemapからサンプルを除外します。

## はじめる

必要なものはDeno 2.xです。初回だけ依存関係とPlaywrightを準備します。

```bash
deno install --frozen --allow-scripts=npm:sharp
deno run -A npm:playwright@1.61.1 install chromium
cp .env.example .env
deno task dev
```

開発サーバーは通常`http://localhost:5173`で起動します。APIも同じoriginです。

```bash
deno task dev                 # SvelteKit + /api
deno task build               # 本番ビルド
deno task preview             # ビルド結果の確認
deno task check               # frontmatter・リンク・svelte-check
deno task test                # Deno Test + Vitest
deno task test:e2e            # Playwright + axe
deno task storybook           # UIカタログ :6006
deno task content:validate    # コンテンツだけを検証
deno task budget:check        # build後の初期JS上限を検証
deno task fmt
deno task lint
```

## 構成

```text
apps/web/                SvelteKitアプリ、ルート、SSR APIアダプター、E2E設定
packages/api/            Hono API、Cookie、Deno KV/メモリrepository、天候service
packages/config/         サイト名、ナビゲーション、既定地点、sampleMode、素材slot
packages/content/        .svx正本、ビルド時registry、検索文書、validator
packages/core/           検索、関連資料、天候変換、リアクションの純粋ロジック
packages/schemas/        Zodによる共通・種別固有スキーマ
packages/tokens/         semantic color、書体、余白、ガラス、motionのCSS token
packages/ui/             共通Svelte UIとStorybook
e2e/                     Playwright + axe
docs/                    設計、執筆、公開runbook
```

公開URLは`/articles/[slug]`、`/works/[slug]`、`/talks/[slug]`、`/archive/{photos|places|wines|moments}/[slug]`です。タグ、GET検索、About、RSS、Atom、Sitemap、OGP、限定APIも同じアプリから配信します。

## コンテンツを入れ替える

正本は[packages/content/entries](/app/packages/content/entries)の`.svx`です。サンプルを実績として公開しないでください。

1. サンプルディレクトリを実コンテンツに置き換える。
2. frontmatterの`sample`を`false`にし、coverは所有するAVIF/WebPを`apps/web/static/images`へ置く。
3. [packages/config/mod.ts](/app/packages/config/mod.ts)の著者情報を確認し、全件を置換した後だけ`sampleMode: false`へ変更する。
4. `deno task check && deno task test && deno task build && deno task budget:check`を通す。

frontmatterとMarkdown機能の詳細は[執筆ガイド](/app/docs/content-authoring.md)、依存方向とランタイム境界は[アーキテクチャ](/app/docs/architecture.md)にあります。視覚設計、ホームのワイヤーフレーム、素材差し替え契約は[デザイン監査](/app/docs/design-audit.md)にまとめています。

プロフィール写真、ロゴ、植物などの有機的な素材はコード生成しません。`packages/config/mod.ts`の`visualAssets`へ所有するAVIF/WebPとalt、crop位置を設定すると、`MediaSlot`が画面ごとの比率と読み込み方を維持して差し替えます。

## 公開

Deno
DeployのSvelteKitプリセットを利用します。独自サーバー、Deno用アダプター、Classic、`deployctl`は使いません。GitHub連携、Preview/Production
Timeline、KV、署名秘密鍵、Cloudflare
DNSの具体的な手順と復旧方法は[公開runbook](/app/docs/deployment.md)を参照してください。

秘密情報はリポジトリに保存しません。最低限`REACTION_SIGNING_SECRET`を各ランタイムcontextへ登録します。
