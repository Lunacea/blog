# Lunacea — Web, UX & Design

UI・UX設計、Webエンジニアリング、グラフィックデザインの考え方を綴る技術ブログです。SvelteKitを唯一のデプロイ単位にし、Hono
APIを同じアプリの`/api/v1`へ組み込んでいます。

同梱コンテンツは交換用サンプルです。`sampleMode`が有効な間は画面へラベルを追加せずに
`noindex`を設定し、RSS・Atom・Sitemapからサンプルを除外します。

## はじめる

必要なものはDeno 2.xです。初回だけ依存関係を準備します。

```bash
deno task content:generate
deno install --frozen --allow-scripts=npm:sharp
cp .env.example .env
deno task dev
```

開発サーバーは通常`http://localhost:5173`で起動します。APIも同じoriginです。

```bash
deno task dev                 # SvelteKit + /api
deno task build               # 本番ビルド
deno task preview             # ビルド結果の確認
deno task preview:audit       # previewのCLS・font・landmark・OGP検証
deno task check               # frontmatter・リンク・svelte-check
deno task test                # Deno Test + Vitest
deno task test:e2e            # Playwright + axe
deno task storybook           # UIカタログ :6006
deno task storybook:check     # 全storyのbuild・axe・responsive・WebGL fallback検証
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
packages/ui/             design token、共通Svelte UI、motion/visual境界、Storybook
e2e/                     Playwright + axe
docs/                    設計、執筆、公開runbook
```

公開記事のURLは`/articles/[slug]`です。`/articles`は番号付きの記事一覧で、
GETフォームから検索・カテゴリ・タグ・ソートを利用できます。
Home内プロフィール、RSS、Atom、Sitemap、OGP、限定APIも同じアプリから配信します。

Works・Archiveの一覧、詳細、互換ルートと対象OGPは廃止し404を返します。旧SearchとAboutは308転送を維持します。

## コンテンツを入れ替える

正本は[packages/content/entries](packages/content/entries)の`.svx`です。サンプルを実績として公開しないでください。

1. サンプルディレクトリを実コンテンツに置き換える。
2. frontmatterの`sample`を`false`にし、coverは所有するAVIF/WebPを`apps/web/static/images`へ置く。
3. [packages/config/mod.ts](packages/config/mod.ts)の著者情報を確認し、全件を置換した後だけ`sampleMode: false`へ変更する。
4. `deno task check && deno task test && deno task build && deno task budget:check`を通す。

frontmatterとMarkdown機能の詳細は[執筆ガイド](docs/content-authoring.md)、依存方向とランタイム境界は[アーキテクチャ](docs/architecture.md)にあります。共通UIと素材の契約は[デザインシステム](docs/design-system.md)を参照してください。

プロフィール写真、ロゴ、植物などの有機的な素材はコード生成しません。`packages/config/mod.ts`の`visualAssets`へ所有するAVIF/WebPとalt、crop位置を設定すると、`MediaSlot`が画面ごとの比率と読み込み方を維持して差し替えます。

## 公開

Deno DeployのSvelteKitプリセットと、`apps/web/svelte.config.js`で設定した
`@deno/svelte-adapter`を利用します。GitHub連携、Preview/Production
Timeline、KV、署名秘密鍵、Cloudflare
DNSの具体的な手順と復旧方法は[公開runbook](docs/deployment.md)を参照してください。

秘密情報はリポジトリに保存しません。最低限`REACTION_SIGNING_SECRET`を各ランタイムcontextへ登録します。

## CI/CD

Quality gateはformat・lint・型・テスト・本番build・JS budget・Storybook・E2Eを検証します。
同じPRまたはbranchの古い実行は取り消します。生成は`check`で済ませ、CIでは
`apps/web`の`build:prepared`がその成果物を再利用します。通常の開発・公開には、
生成とコンテンツ検証を含む`deno task build`を使ってください。

E2Eの初回準備と、本番ビルドに対する実行:

```bash
deno run -A npm:playwright@1.61.1 install chromium
deno task build
E2E_PREVIEW=true deno task test:e2e
```

通常の`test:e2e`は開発サーバー、`E2E_BASE_URL`指定時は指定先を検証します。 CDはDeno
Deployの通知に含まれるSHAをcheckoutしてPreviewを検証し、結果をActionsの
summaryへ記録します。失敗時のブラウザー診断は7日間保存します。
ブランチ保護の設定は[運用手順](.github/docs/branch-protection.md)を参照してください。

## 開発指示と計画

共通の作業方針は[AGENTS.md](AGENTS.md)、パッケージ固有の制約は各ディレクトリの
`AGENTS.md`にまとめています。大きな変更の計画は[計画方針](.agent/PLANS.md)に従い
`.agent/plans/`へ置きます。現行仕様は`docs/`を正本とし、完了・置換済み計画はGit履歴で参照します。
