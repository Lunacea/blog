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

| パッケージ | 責務                                      | 依存してよいもの            |
| ---------- | ----------------------------------------- | --------------------------- |
| `schemas`  | 公開型、frontmatter/API入力検証           | Zodのみ                     |
| `core`     | 検索・関連・変換・トグルの純粋関数        | `schemas`                   |
| `content`  | `.svx` registry、本文索引、ビルド検証     | `schemas`, `core`           |
| `api`      | HTTP境界、外部通信、Cookie、repository    | `schemas`, `core`, `config` |
| `ui`       | 共有表示部品、design tokens、著作素材slot | `schemas`, `config`         |
| `config`   | 公開可能なサイト設定                      | なし                        |
| `web`      | ルート、SEO、composition                  | すべての公開package         |

`core`はDOM、KV、fetchへ依存しません。`api`のリアクション保存はinterface越しにし、Deno
KVとメモリ実装を同じ契約で検証します。

`ui`は`LinkSelector`、semantic `Badge`、action variant、`CatalogControls`、
`ContentDetailView`、`ResponsivePicture`、controlled `ReactionControl`、`ShareActions`を所有します。
これらはroute
state、network、repository、SEOを読みません。`web`はSEO/JSON-LD、URLとquery、画像registry 解決、API
fetchとZod検証、Home固有controller、およびUIへデータを渡す薄いadapterだけを所有します。
WebとStorybookは同じ`packages/ui/src/foundations/global.css`を直接読み込み、アプリ固有の第二のglobal
themeを持ちません。

## レンダリング境界

- Article詳細、Home、RSS/Atom、Sitemap、OGPはプリレンダリングする。WorksとArchiveの一覧・詳細・互換ルートと対象コンテンツは廃止し、旧URLと対象OGPは404とする。
- `/articles`はGET検索をJavaScriptなしで処理するSSRを維持する。公開情報だけを返し、full queryをcache
  keyとする `public, max-age=0, s-maxage=3600, stale-while-revalidate=86400`
  を維持する。絞り込みURLは `noindex,follow`、canonicalは `/articles`。
- Articlesは `view=grid|list` をURLで管理する。初期状態と `grid` は新聞表示、`view=list`
  だけがlistである。category、tag、sort、検索語は表示形式を変更せず、絞り込みは新聞のままでも成立する。categoryは常時表示のstrip、検索はHeaderにあり、tagとsortは両表示の折りたたみ領域に配置し、結果件数は常時表示する。viewのみの変更はFull
  motion時にitem-level View Transitionを使用できる。
- 新聞の「本日のPick
  Up」は、front記事を除いた残りからUTC日付をseedとする決定的な抽選で選び、SSRとshared
  cacheで同じHTMLになる。抽選された記事は同じページの一覧から除き、記事の重複表示を作らない。絞り込み中とlistでは表示しない。
- インプレッションは記事単位の公開カウンタであり、Deno KVに `impression/count` と有効期限付きの
  `impression/seen`
  だけを保存する。IP、User-Agent、参照元、閲覧時刻は保存しない。記録は記事詳細からのsame-origin POST
  `/api/v1/impressions/:type/:slug` で、既存の匿名署名Cookieのactorとsessionごとに一度だけ行う。
  カタログ右のランキングはSSRでKVを読み、KVが読めない場合もカタログは完全に機能する。
- Header検索は全ルートで利用できるGETフォームであり、`q` と `view=list` を `/articles`
  へ送る。JavaScriptがない場合はHeader内の静的フォームが同じ役割を果たす。
- `/search`は検索条件と `view=list` を保持して `/articles`
  へ308転送する。旧Aboutの308転送は維持する。互換転送はprerenderせず、独立したHTTP応答とする。
- `/api/v1`はアプリケーションの動的HTTP境界であり続ける。SSR Articlesと互換redirectは content
  delivery境界であり、別serviceや永続stateを追加しない。
- Mermaidは該当DOMがある記事でだけ遅延importする。
- SVXのGFM、heading、Shiki、Mermaid source、KaTeX変換設定はUI packageの共通build設定を
  WebとStorybookが利用する。KaTeXはbuild時にHTML化し、client runtimeを追加しない。
- Home is prerendered as an uppercase LUNACEA masthead that bleeds past both gutters, a
  business-card introduction, category links and six latest public articles in the shared numbered
  index. It carries no header; every other route gets one hairline sticky bar, and a site-wide
  footer closes all routes. Scrolling is native and continuous; there is no snap controller or
  draggable profile.
- `StaticLight` draws the light, shadow and grain in SVG with no JavaScript. Home renders the full
  field; reading routes keep the grain alone. Home and the article catalog dynamically import
  `editorial-light.ts` when motion is Full and device capabilities permit it, layering one animated
  full-bleed field of key light, cloud cover and grain between the static light and the static
  grain. Text and the C theme control remain HTML and usable before fonts/WebGL resolve. No
  point-cloud hero or custom cursor is mounted. DPR is capped at 1.2/1.5. Offscreen/hidden rendering
  pauses; unmount, Off and context loss dispose the renderer and leave the static composition.
- Theme and motion controls both live in the site footer; Home additionally exposes the theme as the
  masthead C. Motion UI exposes ON/OFF. Persisted `full` maps to ON, `reduced` and `off` map to OFF;
  the existing storage key is retained. OS reduced motion, save-data and forced colors force static
  behavior. The initial Home opening is a nonblocking 1.2-second grain clearing plus masthead
  sharpening, once per tab, never an overlay or content gate.
- Fixed-location weather is fetched only while visiting Home and is expressed solely as how much
  light gets through: clear opens the key light, cloudy/rain/snow close it down. No falling
  particles, labels or location UI. Unavailable weather is neutral. Static shading works without
  WebGL; articles have no weather layer or request. API contracts are unchanged.
- Reveal/parallax remains a reusable UI capability but is not installed by the redesigned global
  layout. Home opening and WebGL own their scoped motion.
- route間のView Transitionは`root`snapshotだけを対象とし、旧pageと新pageを重ねてdissolveする。
  `main`にnameを与えるとgroupが自身のboxをanimateし、長いpageをscrollしてから離脱したときに旧
  snapshotがviewportを縦に流れてしまうため、page内のどのelementにも`view-transition-name`を与えない。
  重ねる理由はHeaderとFooterが両側で同一pixelになりdissolveでは静止して見える一方、順番に切り替えると
  1frameだけ画面全体が空くこと。query
  stringだけの遷移はより速く、記事の前後移動は全面slideとして扱う。
  Reduced/Offと履歴移動では即時切替する。
- Homeの天候は`config.defaultLocation`の固定地点だけをclientから取得し、地点名、文章、気温、設定UIを表示しない。
  `fog`は`cloudy`、`storm`は`rain`、取得fallbackは`neutral`な環境表現へ正規化する。
- ロゴ、人物、植物などの著作素材は`config.visualAssets`から`MediaSlot`へ渡す。空slotは構造だけを示し、有機的な図像をコード生成しない。
- 記事内LinkCardは`href`を安定keyとして、明示実行する`deno task links:refresh`だけが外部ページの
  title、description、site、OGP画像を取得する。生成metadataはGit管理JSON、画像は repository-local
  WebPを正本とする。通常のvalidation、build、prerenderはcacheだけを読み、 runtime
  proxy、外部画像hotlink、暗黙のnetwork fetchは導入しない。refreshはHTTP(S)に限定し、
  private/loopback address、redirect先、timeout、content type、HTML/image sizeを検証し、失敗時は
  既存cacheを破壊しない。

ビルド後のbudget checkは記事詳細の初期JavaScript依存を再帰集計し、gzip 150
KiBを超えたら失敗します。MermaidとWebGLのdynamic importはこの集計へ入りません。Homeの再帰WebGL
graphはgzip 230 KiBを上限とします。

Articles SSRを戻す場合はquery parserを残したまま一覧をprerenderへ戻し、`/search`のGET実装を
復元します。互換routeは独立して戻せます。Home WebGLはdynamic lighting
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
