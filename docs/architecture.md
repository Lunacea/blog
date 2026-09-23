# アーキテクチャ

Status: Accepted

## 決定

このシステムはSvelteKitを唯一のデプロイ単位とするモジュラーモノリスです。公開コンテンツはGit管理の`.svx`、閲覧者由来のリアクションとそのレート制限だけはDeno
KVを正本にします。天候は20分キャッシュ可能な環境情報であり、永続データではありません。

```mermaid
flowchart LR
  Source[packages/content .svx] --> Validate[Zod + link validator]
  Validate --> Registry[build registry + search index]
  Registry --> Pages[SvelteKit prerendered pages]
  Registry --> Articles[SSR Articles GET search]
  Browser --> Pages
  Browser --> API[/api/v1 Hono]
  API --> OpenMeteo[Open-Meteo]
  API --> KV[(Deno KV)]
  Pages --> Feeds[RSS / Atom / Sitemap / OGP]
```

Honoは別サーバーではありません。SvelteKitのcatch-all
endpointがWeb標準`Request`をHonoへ渡し、レスポンスをそのまま返します。これによりorigin、Cookie、デプロイ、ログの境界が一つになります。

## パッケージの責務

| パッケージ | 責務                                    | 依存してよいもの            |
| ---------- | --------------------------------------- | --------------------------- |
| `schemas`  | 公開型、frontmatter/API入力検証         | Zodのみ                     |
| `core`     | 検索・関連・変換・トグルの純粋関数      | `schemas`                   |
| `content`  | `.svx` registry、本文索引、ビルド検証   | `schemas`, `core`           |
| `api`      | HTTP境界、外部通信、Cookie、repository  | `schemas`, `core`, `config` |
| `ui`       | design tokens、基本CSS、primitive、icon | Svelte、Bits UI、Iconify    |
| `config`   | 公開可能なサイト設定                    | なし                        |
| `web`      | ルート、SEO、composition                | すべての公開package         |

`core`はDOM、KV、fetchへ依存しません。`api`のリアクション保存はinterface越しにし、Deno
KVとメモリ実装を同じ契約で検証します。

`ui`は`@lunacea/ui/primitives`、`icons`、`utils`、`fonts`、`styles.css`だけを公開します。
記事、Home、site shell、表示設定、navigation、WebGLは`apps/web/src/lib`の機能別ディレクトリが
所有し、具体的なファイルからimportします。`ui`は`$app`、site config、content schema、network、
Three.js、mdsvex、KaTeX、Mermaidへ依存しません。

Webの`src/styles/app.css`が唯一のTailwind入口です。UIの公開CSSとWeb固有のtokens、記事DOM、 View
Transitionを静的にimportします。Storybookもこの入口を使いますが、Storyとfixtureは
`apps/web/stories`に分離し、本番のTailwind scanへ含めません。

## レンダリング境界

- Article詳細、Home、RSS/Atom、Sitemap、OGPはプリレンダリングする。WorksとArchiveの一覧・詳細・互換ルートと対象コンテンツは廃止し、旧URLと対象OGPは404とする。
- `/articles`はGET検索をJavaScriptなしで処理するSSRを維持する。公開情報だけを返し、full queryをcache
  keyとする `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`
  を維持する。絞り込みURLは `noindex,follow`、canonicalは `/articles`。
- Articlesは同じ番号付きindexを常に使う。categoryは右のrail、sortはindex直前、searchとtagは
  下部に置く。選択中のcategory、sort、tagは同じ下線で示し、検索・filter中は条件と解除操作を
  indexの前に表示する。すべてGET link/formであり、JavaScriptなしでも利用できる。
- インプレッションは記事単位の公開カウンタであり、Deno KVに `impression/count` と有効期限付きの
  `impression/seen`
  だけを保存する。IP、User-Agent、参照元、閲覧時刻は保存しない。記録は記事詳細からのsame-origin POST
  `/api/v1/impressions/:type/:slug` で、既存の匿名署名Cookieのactorとsessionごとに一度だけ行う。
- Header検索は全ルートで利用できるGETフォームであり、`q`を`/articles`へ送る。JavaScriptが
  ない場合はHeader内の静的フォームが同じ役割を果たす。既存の`view=list` queryは互換のため
  保持するが、現在のindex表示を分岐しない。
- `/search`は検索条件と `view=list` を保持して `/articles`
  へ308転送する。旧Aboutの308転送は維持する。互換転送はprerenderせず、独立したHTTP応答とする。
- `/api/v1`はアプリケーションの動的HTTP境界であり続ける。SSR Articlesと互換redirectは content
  delivery境界であり、別serviceや永続stateを追加しない。
- Mermaidと図の拡張（描画、両テーマの控え、配色、拡大表示）は`articles/diagrams/`にまとめ、
  該当DOMがある記事でだけ動的importする。配色は`:root`の宣言をprobeへ写し、`color-scheme`で
  表示していないテーマの色もブラウザに解決させる。表示中のテーマで描いたあと、もう一方の
  テーマの図を空き時間に描いて控え、テーマ切り替えでは描き直さず差し替える。
- SVXのGFM、heading、Shiki、Mermaid source、KaTeX変換設定は
  `apps/web/mdsvex.config.js`をWebとStorybookが利用する。KaTeXはbuild時にHTML化し、client
  runtimeを追加しない。
- Home is prerendered as an uppercase LUNACEA masthead that bleeds past both gutters, a
  business-card introduction and six latest public articles in the shared numbered index. It carries
  no header; every other route gets one hairline sticky bar, and a site-wide footer closes all
  routes. Scrolling is native and continuous; there is no snap controller or draggable profile.
- `StaticLight` draws the light and grain in SVG with no JavaScript. The root layout mounts one
  site-wide field and dynamically imports `editorial-light.ts` when motion is Full and device
  capabilities permit it. Text and the C theme control remain HTML and usable before fonts/WebGL
  resolve. No point-cloud hero or custom cursor is mounted. DPR is capped at 1.2/1.5.
  Offscreen/hidden rendering pauses; unmount, Off and context loss dispose the renderer and leave
  the static composition.
- Theme and motion controls both live in the site footer; Home additionally exposes the theme as the
  masthead C. Motion UI exposes ON/OFF. Persisted `full` maps to ON, `reduced` and `off` map to OFF;
  the existing storage key is retained. OS reduced motion, save-data and forced colors force static
  behavior. The initial Home opening is a nonblocking 1.2-second grain clearing plus masthead
  sharpening, once per tab, never an overlay or content gate.
- Fixed-location weather is fetched by the root layout and is expressed solely as how much light
  gets through: clear opens the key light, cloudy/rain/snow close it down. No falling particles,
  labels or location UI. Unavailable weather is neutral. Static shading works without WebGL. On
  article details the paper-colored `ReadingSurface` covers the field while the header and tail
  expose it. API contracts are unchanged.
- 未使用だったreveal/parallax selectorは持たない。Home openingとWebGLだけが各機能内でmotionを
  所有する。
- route間のView Transitionでは`root`と天候背景をsnapshotに含めない。旧page内容は旧状態だけの
  `route-content` snapshotとしてその場でfade outし、新しいpage内容はlive DOMで少し遅れてfade
  inする。headerの出入りと記事紙面の受け渡しだけを個別のsnapshotで動かす。一覧から記事へは紙面が
  せり上がり、記事から`/`または`/articles`へ戻り、同じ記事の行が画面内にあるときは、遷移の間
  だけその行に`article-paper`の名前を付けて紙面を行へ畳む。形の補間は見えていた紙面の範囲から
  始める。リンクと履歴移動（戻る・進む）は同じ遷移を使う。これによりWebGLの描画ループは遷移中も
  継続する。どの遷移を使うかは`route-transition.ts`がURLだけから決め、`page-transitions.ts`が
  印・保険のタイマー・Web Animationsを遷移1回分の後片付けにまとめる。テーマ切り替えだけは
  `root`snapshot1枚で画面全体をcrossfadeし、その間WebGLは新しいテーマで1枚描いてから止まる。
  WebGLを使わない低メモリ・低コア端末では即時に切り替える。query stringだけの遷移はより速くし、
  絞り込みでは遷移しない。Offとアンカー移動では即時切替する。
- サイトの天候は`config.defaultLocation`の固定地点だけをclientから取得し、地点名、文章、気温、設定UIを表示しない。
  `fog`は`cloudy`、`storm`は`rain`、取得fallbackは`neutral`な環境表現へ正規化する。
  時刻の光（朝夕の色づき、光の向き、夜）はAPIへ項目を足さず、WebGL側で同じ地点の緯度経度と
  閲覧時刻から太陽高度を計算する。静的な陰影は時刻で変えない。
- ロゴ、人物、植物などの著作素材は`config.visualAssets`から`MediaSlot`へ渡す。空slotは構造だけを示し、有機的な図像をコード生成しない。
- 記事内LinkCardは`href`を安定keyとして、明示実行する`deno task links:refresh`だけが外部ページの
  title、description、site、OGP画像を取得する。生成metadataはGit管理JSON、画像は repository-local
  WebPを正本とする。通常のvalidation、build、prerenderはcacheだけを読み、 runtime
  proxy、外部画像hotlink、暗黙のnetwork fetchは導入しない。refreshはHTTP(S)に限定し、
  private/loopback address、redirect先、timeout、content type、HTML/image sizeを検証し、失敗時は
  既存cacheを破壊しない。

ビルド後のbudget checkは記事詳細の初期JavaScript依存を再帰集計し、gzip 150
KiBを超えたら失敗します。MermaidとThree.js本体のdynamic importはこの集計へ入りません。天候表現の
再帰WebGL graphはgzip 230 KiBを上限とします。

Articles SSRを戻す場合はquery parserを残したまま一覧をprerenderへ戻し、`/search`のGET実装を
復元します。互換routeは独立して戻せます。天候背景のWebGLはdynamic lighting
moduleを外すだけでHTML誌名と静止陰影へ戻せます。

## コンテンツと検索

ディレクトリと`type:slug`が安定IDです。意図的なmigrationだけは一意な`legacyIds`と
`legacyPaths`で旧識別子を保持します。Zodのdiscriminated unionがArticle、Work、Diary、
Photo、Place、Wine、Momentを検証し、Talkはevent情報を持つArticle categoryとして扱います。
validatorはcanonical/legacy ID重複、slug/ディレクトリ不一致、関連ID、内部リンク、coverの存在、
外部画像hotlink、LinkCard URLに対応するlocal preview cacheも検査します。

検索文書はビルド時に本文をplain
text化して生成します。クエリは`Intl.Segmenter("ja")`の語と正規化後のbigramを併用し、タイトル8、タグ5、概要3、本文1の重みで順位付けします。

ArticleのSVX
sourceはbuild時に文章、technical、mediaの出現順ブロックと正規化位置・量、本文文字数、H2/H3
IDを生成する。目次の構造表示は縦長コードマップ、一覧は読了1分ごとに増える最大5枚の紙として表す。本文文字列は複製しない。見出しとの対応はIDで結び付ける。

## リアクションとプライバシー

匿名actorはランダムUUIDとHMAC署名を持つ`Secure; HttpOnly; SameSite=Lax`
Cookieです。KVにはactorごとの選択、コンテンツ別集計、時間bucketの操作数だけを保存します。IP、User-Agent、位置情報、メールアドレスは保存しません。

PUTは同一origin、Zod入力、256 byte上限、actorあたり10分30操作で保護します。KV更新はversionstamp
checkを使ったatomic retryで集計と選択を同時に更新します。公開モデルは称賛を表す1種類だけで、
レスポンスは`count`とactor自身の`selected`を返します。PUTはGETと同じ
`/api/v1/reactions/:type/:slug`へ`active`を送ります。旧3種類のreaction keyは移行・参照せず、
単一称賛用の新しいKV keyを正本とします。

## 障害時の縮退

- Open-Meteo失敗: config固定地点の現地時刻とday/nightだけを返し、画面はneutral背景を使う。
- WebGL未対応・低メモリ・save-data・Reduced/Off:
  HomeのHTML誌名と静止した陰影を維持し、他routeには天候装飾を表示しない。
- Mermaid変換失敗: ソースを残し、表示失敗のaria-labelを付ける。
- リアクション失敗: 本文を妨げず、live regionにだけ通知する。
- JavaScript無効: 本文、主要ナビゲーション、Articles
  GET検索、フィードendpointは利用可能。新聞とリストの切替、目次の通常リンクを利用できる。

Homeのプロフィールは名刺（91×55mm比）を模したカードで、`config.visualAssets.profile`のポートレート、名前、専門領域、GitHub/X/Emailのアイコンリンクだけを持ち、最新記事へ続く。技術名一覧は掲載しない。

## Editorial OG images

Article OG URLs remain stable and prerendered. Every cover variant uses the same 1200×630 monochrome
composition: LUNACEA in Archivo, the actual article category, the complete title in Zen Kaku Gothic
New Bold, two hairline rules and a lunar disc bleeding off the right edge. Sharp/Pango uses
repository-pinned fonts and measured wrapping/auto-fit; no foreignObject or cover-dependent template
is used.
